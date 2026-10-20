import { f1Feed } from "@/lib/f1/feed";
import { feedMode, getLiveSnapshot, onFeedChange, unavailable } from "@/lib/f1/source";
import type { LiveTimingPollResponse } from "@/types/live-timing";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Teto do plano gratuito da Vercel. O stream fecha um pouco antes e o navegador reabre sozinho.
export const maxDuration = 300;

/**
 * Live timing em tempo real via Server-Sent Events.
 *
 * Cada stream fica aberto por uma janela (290 s na Vercel, 25 s na Netlify,
 * 30 min em servidor próprio) e então termina com o evento `reconnect`. O
 * EventSource do navegador reabre automaticamente em ~0,5 s, então o visitante
 * vê um fluxo contínuo mesmo em plataformas serverless.
 */
function windowSeconds(): number {
  const configured = Number(process.env.F1_STREAM_SECONDS);
  if (Number.isFinite(configured) && configured > 0) return configured;
  if (process.env.NETLIFY) return 25;
  if (process.env.VERCEL) return 290;
  return 1800;
}

const THROTTLE_MS = 1000;
const KEEPALIVE_MS = 15_000;
const EXTERNAL_POLL_MS = 1500;

export async function GET(request: Request) {
  const encoder = new TextEncoder();
  const cleanups: Array<() => void> = [];
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (chunk: string) => { if (!closed) { try { controller.enqueue(encoder.encode(chunk)); } catch { closed = true; } } };
      const send = (event: string, data: unknown) => write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      const close = () => {
        if (closed) return;
        closed = true;
        for (const cleanup of cleanups.splice(0)) cleanup();
        try { controller.close(); } catch { /* já fechado */ }
      };
      request.signal.addEventListener("abort", close);

      write("retry: 500\n\n");

      let lastKey = "";
      const push = async () => {
        try {
          const { health, snapshot } = await getLiveSnapshot();
          const body: LiveTimingPollResponse = { connected: health.connected && Boolean(snapshot), lastMessageAt: health.lastMessageAt, ...(snapshot ? { snapshot } : {}) };
          const key = feedMode === "direct" ? `${f1Feed.getVersion()}:${body.connected}` : JSON.stringify({ ...body, snapshot: snapshot ? { ...snapshot, emittedAt: "" } : null });
          if (key === lastKey) return;
          lastKey = key;
          send("snapshot", body);
        } catch (error) {
          lastKey = "";
          send("offline", { connected: false, lastMessageAt: null, error: unavailable(error).error });
        }
      };

      // Agrupa rajadas de deltas: no máximo um envio por segundo.
      let pending: NodeJS.Timeout | null = null;
      let lastSentAt = 0;
      const schedule = () => {
        if (pending || closed) return;
        const wait = Math.max(0, THROTTLE_MS - (Date.now() - lastSentAt));
        pending = setTimeout(() => { pending = null; lastSentAt = Date.now(); void push(); }, wait);
      };
      cleanups.push(() => { if (pending) clearTimeout(pending); });

      await push();
      lastSentAt = Date.now();

      cleanups.push(onFeedChange(schedule));
      if (feedMode === "external") {
        const poll = setInterval(schedule, EXTERNAL_POLL_MS);
        cleanups.push(() => clearInterval(poll));
      }

      // Comentário SSE mantém proxies abertos; também verifica se a conexão com a F1 segue viva.
      const keepalive = setInterval(() => { write(": ping\n\n"); schedule(); }, KEEPALIVE_MS);
      cleanups.push(() => clearInterval(keepalive));

      const end = setTimeout(() => { send("reconnect", { afterMs: 500 }); close(); }, windowSeconds() * 1000);
      cleanups.push(() => clearTimeout(end));
    },
    cancel() {
      closed = true;
      for (const cleanup of cleanups.splice(0)) cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-store, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
