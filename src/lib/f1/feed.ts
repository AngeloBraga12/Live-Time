import WebSocket from "ws";
import { applyDelta, type Json } from "./merge";

/**
 * Conexão direta com o feed oficial de live timing da F1 (SignalR Core).
 *
 * Funciona tanto em servidor sempre ligado (Docker) quanto em serverless
 * (Vercel/Netlify):
 * - Ao assinar os canais, a F1 devolve o estado COMPLETO da sessão em ~1 s.
 *   Por isso uma função que acabou de acordar já tem dados na primeira resposta.
 * - Enquanto a instância estiver ativa a conexão é reaproveitada e os deltas são
 *   aplicados em memória; requisições seguintes respondem na hora.
 * - Se a conexão ficar sem nenhum quadro por muito tempo (instância congelada,
 *   rede caiu) ela é descartada e refeita automaticamente.
 */

// F1_SIGNALR_URL só existe para testes (servidor SignalR falso).
const HTTP_URL = (process.env.F1_SIGNALR_URL || "https://livetiming.formula1.com/signalrcore").replace(/\/+$/, "");
const WS_URL = HTTP_URL.replace(/^http/, "ws");
const ORIGIN = "https://www.formula1.com";
const RECORD_SEPARATOR = "\x1e";

export const F1_FEED_ENDPOINT = WS_URL;

export const TOPICS = [
  "Heartbeat",
  "SessionInfo",
  "SessionStatus",
  "TrackStatus",
  "LapCount",
  "ExtrapolatedClock",
  "DriverList",
  "TimingData",
  "TimingAppData",
  "TimingStats",
  "WeatherData",
  "RaceControlMessages",
] as const;

export type Topic = (typeof TOPICS)[number];
export type FeedState = Partial<Record<Topic, Json>>;

export type FeedStatus = {
  connected: boolean;
  status: "IDLE" | "CONNECTING" | "CONNECTED" | "DISCONNECTED";
  lastMessageAt: string | null;
  connectedAt: string | null;
  error: string | null;
};

/** Sem nenhum quadro (dados ou ping, que o servidor manda a cada ~15 s) por este tempo, a conexão é considerada morta. */
const STALE_AFTER_MS = 30_000;
/** Refaz a assinatura periodicamente para corrigir qualquer delta perdido. */
const RESYNC_AFTER_MS = 20 * 60_000;
/** Fecha a conexão quando ninguém usa o feed por este tempo. */
const IDLE_CLOSE_MS = 90_000;
const CONNECT_TIMEOUT_MS = 8_000;

type Listener = () => void;

class F1Feed {
  private ws: WebSocket | null = null;
  private state: FeedState = {};
  private hasSnapshot = false;
  private connectedAtMs = 0;
  private lastFrameAtMs = 0;
  private lastDataAtMs = 0;
  private lastUsedAtMs = 0;
  private connecting: Promise<void> | null = null;
  private lastError: string | null = null;
  private listeners = new Set<Listener>();
  private idleTimer: NodeJS.Timeout | null = null;
  private version = 0;

  /** Garante uma conexão viva com o estado completo carregado. */
  async ensure(): Promise<void> {
    this.touch();
    if (this.isFresh()) return;
    // Uma instância serverless que acabou de "descongelar" pode ter quadros
    // pendentes no socket; deixa o event loop processá-los antes de decidir.
    if (this.ws?.readyState === WebSocket.OPEN) {
      await new Promise((resolve) => setImmediate(resolve));
      if (this.isFresh()) return;
    }
    if (!this.connecting) {
      this.connecting = this.connect().finally(() => { this.connecting = null; });
    }
    return this.connecting;
  }

  getState(): FeedState { return this.state; }
  getVersion(): number { return this.version; }

  getStatus(): FeedStatus {
    const open = this.ws?.readyState === WebSocket.OPEN && this.hasSnapshot;
    return {
      connected: open,
      status: open ? "CONNECTED" : this.connecting ? "CONNECTING" : this.ws ? "DISCONNECTED" : "IDLE",
      lastMessageAt: this.lastDataAtMs ? new Date(this.lastDataAtMs).toISOString() : null,
      connectedAt: this.connectedAtMs ? new Date(this.connectedAtMs).toISOString() : null,
      error: this.lastError,
    };
  }

  /** Avisa sempre que o estado mudar. Enquanto houver ouvintes a conexão se mantém e se refaz sozinha. */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    this.touch();
    return () => {
      this.listeners.delete(listener);
      this.touch();
    };
  }

  private isFresh(): boolean {
    const now = Date.now();
    return this.ws?.readyState === WebSocket.OPEN
      && this.hasSnapshot
      && now - this.lastFrameAtMs < STALE_AFTER_MS
      && now - this.connectedAtMs < RESYNC_AFTER_MS;
  }

  private touch() {
    this.lastUsedAtMs = Date.now();
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      if (this.listeners.size === 0 && Date.now() - this.lastUsedAtMs >= IDLE_CLOSE_MS) this.close();
    }, IDLE_CLOSE_MS + 1000);
    this.idleTimer.unref?.();
  }

  private close() {
    const ws = this.ws;
    this.ws = null;
    this.hasSnapshot = false;
    try { ws?.terminate(); } catch { /* já fechado */ }
  }

  private emit() {
    this.version += 1;
    for (const listener of this.listeners) {
      try { listener(); } catch { /* um ouvinte com erro não derruba os outros */ }
    }
  }

  private async connect(): Promise<void> {
    const headers: Record<string, string> = { "User-Agent": "BestHTTP", Origin: ORIGIN };

    // O balanceador da F1 usa o cookie AWSALBCORS para manter a afinidade entre negotiate e WebSocket.
    const preflight = await fetch(`${HTTP_URL}/negotiate`, { method: "OPTIONS", headers, signal: AbortSignal.timeout(CONNECT_TIMEOUT_MS) });
    const cookie = (preflight.headers.get("set-cookie") ?? "").match(/AWSALBCORS=([^;]+)/)?.[1];
    if (cookie) headers.Cookie = `AWSALBCORS=${cookie}`;

    const negotiate = await fetch(`${HTTP_URL}/negotiate?negotiateVersion=1`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "text/plain" },
      signal: AbortSignal.timeout(CONNECT_TIMEOUT_MS),
    });
    if (!negotiate.ok) throw this.fail(`Negotiate com a F1 falhou (HTTP ${negotiate.status}).`);
    const { connectionToken } = await negotiate.json() as { connectionToken?: string };
    if (!connectionToken) throw this.fail("A F1 não devolveu token de conexão.");

    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(`${WS_URL}?id=${encodeURIComponent(connectionToken)}`, { headers });
      let handshakeDone = false;
      let settled = false;
      const timeout = setTimeout(() => finish(new Error("Tempo esgotado ao conectar ao feed da F1.")), CONNECT_TIMEOUT_MS);

      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        if (error) {
          this.fail(error.message);
          try { ws.terminate(); } catch { /* ignore */ }
          reject(error);
        } else resolve();
      };

      ws.on("open", () => ws.send(`{"protocol":"json","version":1}${RECORD_SEPARATOR}`));

      ws.on("message", (raw) => {
        this.lastFrameAtMs = Date.now();
        let changed = false;
        for (const segment of raw.toString().split(RECORD_SEPARATOR)) {
          if (!segment) continue;
          let frame: { type?: number; error?: string; invocationId?: string; result?: Record<string, Json>; target?: string; arguments?: Json[] };
          try { frame = JSON.parse(segment); } catch { continue; }

          if (!handshakeDone) {
            if (frame.error) return finish(new Error(`Handshake recusado: ${frame.error}`));
            handshakeDone = true;
            ws.send(JSON.stringify({ type: 1, invocationId: "0", target: "Subscribe", arguments: [TOPICS] }) + RECORD_SEPARATOR);
            continue;
          }

          // Resposta da assinatura: estado completo da sessão.
          if (frame.type === 3 && frame.invocationId === "0") {
            if (frame.error) return finish(new Error(`Assinatura recusada: ${frame.error}`));
            const previous = this.ws;
            this.state = { ...(frame.result ?? {}) } as FeedState;
            this.ws = ws;
            this.hasSnapshot = true;
            this.connectedAtMs = Date.now();
            this.lastDataAtMs = Date.now();
            this.lastError = null;
            if (previous && previous !== ws) { try { previous.terminate(); } catch { /* ignore */ } }
            changed = true;
            finish();
            continue;
          }

          // Delta de um canal: { target: "feed", arguments: [canal, dados, horário] }
          if (frame.type === 1 && frame.target === "feed" && Array.isArray(frame.arguments) && ws === this.ws) {
            const [topic, data] = frame.arguments;
            if (typeof topic === "string" && data !== undefined) {
              const key = topic as Topic;
              this.state[key] = applyDelta(this.state[key], data);
              this.lastDataAtMs = Date.now();
              changed = true;
            }
          }
          // type 6 = ping do servidor; só atualiza lastFrameAtMs.
          if (frame.type === 7) return finish(new Error(`A F1 encerrou a conexão${frame.error ? `: ${frame.error}` : ""}.`));
        }
        if (changed) this.emit();
      });

      ws.on("error", (error) => finish(error instanceof Error ? error : new Error(String(error))));

      ws.on("close", () => {
        finish(new Error("Conexão com a F1 fechada antes de receber os dados."));
        if (this.ws !== ws) return;
        this.ws = null;
        this.hasSnapshot = false;
        this.emit();
        // Alguém ainda está assistindo: reconecta sozinho.
        if (this.listeners.size > 0) {
          setTimeout(() => { if (this.listeners.size > 0) void this.ensure().catch(() => undefined); }, 2000).unref?.();
        }
      });
    });
  }

  private fail(message: string): Error {
    this.lastError = message;
    return new Error(message);
  }
}

// Uma única conexão por instância (sobrevive ao hot reload em desenvolvimento).
const globalForFeed = globalThis as typeof globalThis & { __liveTimeF1Feed?: F1Feed };
export const f1Feed = globalForFeed.__liveTimeF1Feed ??= new F1Feed();
