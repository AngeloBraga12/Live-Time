import type { LiveTimingSnapshot } from "@/types/live-timing";

/**
 * Guarda a última classificação válida que o feed entregou.
 *
 * O feed da F1 costuma manter a última sessão carregada entre etapas, mas há
 * janelas (troca de fim de semana, instância nova, instabilidade do SignalR) em
 * que ele responde sem dados. Sem isto a página ficaria em branco; com isto ela
 * segue mostrando o último resultado com a marcação de que é uma cópia.
 *
 * Vive na memória da instância (não sobrevive a frio), por isso o navegador
 * também guarda uma cópia em localStorage — ver src/lib/client-cache.ts.
 */

type Entry = { snapshot: LiveTimingSnapshot; storedAt: string };

const globalForCache = globalThis as typeof globalThis & { __liveTimeLastSnapshot?: Entry | null };

const MAX_AGE_MS = 45 * 24 * 60 * 60 * 1000;

export function rememberSnapshot(snapshot: LiveTimingSnapshot | null): void {
  if (!snapshot || snapshot.drivers.length === 0) return;
  globalForCache.__liveTimeLastSnapshot = { snapshot, storedAt: new Date().toISOString() };
}

export function lastKnownSnapshot(): Entry | null {
  const entry = globalForCache.__liveTimeLastSnapshot;
  if (!entry) return null;
  if (Date.now() - Date.parse(entry.storedAt) > MAX_AGE_MS) {
    globalForCache.__liveTimeLastSnapshot = null;
    return null;
  }
  return entry;
}
