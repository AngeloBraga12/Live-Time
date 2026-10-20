import type { LiveTimingSnapshot } from "@/types/live-timing";
import { F1_FEED_ENDPOINT, f1Feed, type FeedState } from "./feed";
import { buildSnapshot } from "./normalize";

/**
 * Origem dos dados do painel.
 *
 * Padrão: conexão direta com o feed da F1, dentro do próprio servidor Next.js.
 * Funciona na Vercel, Netlify, Docker ou localmente, sem nenhum serviço extra.
 *
 * Opcional: `F1_LIVETIMING_API_URL` aponta para uma instância da
 * f1-livetiming-api hospedada à parte; nesse caso o site só a consulta.
 */

const externalUrl = process.env.F1_LIVETIMING_API_URL?.trim().replace(/\/+$/, "") || "";

export const feedMode: "direct" | "external" = externalUrl ? "external" : "direct";
export const feedEndpoint = externalUrl || F1_FEED_ENDPOINT;

export type FeedHealth = {
  service: string;
  mode: "direct" | "external";
  connected: boolean;
  status: string;
  lastMessageAt: string | null;
  uptimeSeconds: number | null;
  timestamp: string;
  apiBaseUrl: string;
  error?: string;
};

type Row = Record<string, unknown>;
const row = (value: unknown): Row => value && typeof value === "object" && !Array.isArray(value) ? value as Row : {};

async function external(path: string): Promise<Row> {
  const response = await fetch(`${externalUrl}/api/${path}`, { cache: "no-store", signal: AbortSignal.timeout(4000), headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`f1-livetiming-api respondeu HTTP ${response.status} em /api/${path}.`);
  return row(await response.json());
}

/** Converte as respostas da f1-livetiming-api para o mesmo formato bruto do feed. */
async function externalState(): Promise<{ state: FeedState; health: FeedHealth }> {
  const status = await external("status");
  const connected = status.isConnected === true || String(status.status).toUpperCase() === "CONNECTED";
  const health: FeedHealth = {
    service: "f1-livetiming-api", mode: "external", connected,
    status: connected ? "CONNECTED" : "DISCONNECTED",
    lastMessageAt: typeof status.lastMessageAt === "string" ? status.lastMessageAt : null,
    uptimeSeconds: typeof status.uptimeSeconds === "number" ? status.uptimeSeconds : null,
    timestamp: new Date().toISOString(), apiBaseUrl: externalUrl,
  };
  if (!connected) return { state: {}, health };
  const [leaderboard, weather, raceControl] = await Promise.all([external("leaderboard"), external("weather"), external("race-control")]);
  const state: FeedState = {
    SessionInfo: leaderboard.Session as FeedState["SessionInfo"],
    LapCount: leaderboard.LapCount as FeedState["LapCount"],
    TimingData: { Lines: leaderboard.Lines } as FeedState["TimingData"],
    WeatherData: weather.Weather as FeedState["WeatherData"],
    RaceControlMessages: { Messages: raceControl.RaceControl } as FeedState["RaceControlMessages"],
  };
  return { state, health };
}

function directHealth(): FeedHealth {
  const status = f1Feed.getStatus();
  return {
    service: "F1 SignalR (conexão direta)", mode: "direct",
    connected: status.connected, status: status.status,
    lastMessageAt: status.lastMessageAt,
    uptimeSeconds: status.connectedAt ? Math.round((Date.now() - Date.parse(status.connectedAt)) / 1000) : null,
    timestamp: new Date().toISOString(), apiBaseUrl: F1_FEED_ENDPOINT,
    ...(status.error && !status.connected ? { error: status.error } : {}),
  };
}

export async function getFeedHealth(): Promise<FeedHealth> {
  if (feedMode === "external") return (await externalState().catch((error: unknown) => ({ health: unavailable(error) }))).health;
  try { await f1Feed.ensure(); } catch { /* o erro vai em directHealth().error */ }
  return directHealth();
}

export type LiveResult = { health: FeedHealth; snapshot: LiveTimingSnapshot | null };

export async function getLiveSnapshot(): Promise<LiveResult> {
  if (feedMode === "external") {
    const { state, health } = await externalState();
    return { health, snapshot: health.connected ? buildSnapshot(state, health.lastMessageAt ?? new Date().toISOString()) : null };
  }
  await f1Feed.ensure();
  const health = directHealth();
  return { health, snapshot: health.connected ? buildSnapshot(f1Feed.getState(), new Date().toISOString()) : null };
}

/** Só no modo direto: avisa a cada mudança do feed. Retorna a função para cancelar. */
export function onFeedChange(listener: () => void): () => void {
  if (feedMode !== "direct") return () => undefined;
  return f1Feed.subscribe(listener);
}

export function unavailable(error: unknown): FeedHealth {
  return {
    service: feedMode === "direct" ? "F1 SignalR (conexão direta)" : "f1-livetiming-api",
    mode: feedMode, connected: false, status: "UNAVAILABLE", lastMessageAt: null, uptimeSeconds: null,
    timestamp: new Date().toISOString(), apiBaseUrl: feedEndpoint,
    error: error instanceof Error ? error.message : "Feed indisponível.",
  };
}
