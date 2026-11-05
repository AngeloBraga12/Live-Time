import type { LiveTimingSnapshot } from "@/types/live-timing";

/**
 * Última classificação vista neste navegador.
 *
 * A cópia do servidor vive na memória da instância e some quando a função
 * serverless é encerrada. Esta cópia local garante que, ao abrir o site sem o
 * feed no ar, o visitante ainda veja o último resultado (marcado como cópia)
 * em vez de uma tela vazia.
 */

const KEY = "apex:last-snapshot";
const MAX_AGE_MS = 45 * 24 * 60 * 60 * 1000;

type Entry = { snapshot: LiveTimingSnapshot; storedAt: string };

export function readCachedSnapshot(): Entry | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as Entry;
    if (!entry?.snapshot?.drivers?.length || !entry.storedAt) return null;
    if (Date.now() - Date.parse(entry.storedAt) > MAX_AGE_MS) {
      window.localStorage.removeItem(KEY);
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

export function writeCachedSnapshot(snapshot: LiveTimingSnapshot): void {
  if (typeof window === "undefined" || !snapshot.drivers.length) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ snapshot, storedAt: new Date().toISOString() } satisfies Entry));
  } catch {
    /* armazenamento cheio ou bloqueado: o painel segue funcionando sem a cópia */
  }
}
