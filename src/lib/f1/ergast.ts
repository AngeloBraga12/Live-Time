/**
 * Acesso à base de resultados históricos da F1 (Ergast).
 *
 * A API original deixou de responder em ergast.com/api/f1 (HTTP 404 desde que o
 * serviço foi desligado). O mantenedor publicou o continuation oficial em
 * api.jolpi.ca/ergast, com o mesmo formato de resposta. Este módulo prova as
 * bases em ordem para o site continuar funcionando se a hospedagem mudar de
 * novo, e permite fixar a base com `ERGAST_BASE_URL` no ambiente.
 */

const DEFAULT_BASES = ["https://api.jolpi.ca/ergast/f1", "https://ergast.com/api/f1"];

function bases(): string[] {
  const configured = process.env.ERGAST_BASE_URL?.trim().replace(/\/+$/, "");
  return configured ? [configured, ...DEFAULT_BASES.filter((b) => b !== configured)] : DEFAULT_BASES;
}

const globalForErgast = globalThis as typeof globalThis & { __ergastBase?: string };

async function get(path: string, init?: RequestInit): Promise<Response> {
  const candidates = globalForErgast.__ergastBase ? [globalForErgast.__ergastBase, ...bases()] : bases();
  let lastError: unknown = null;
  for (const base of candidates) {
    try {
      const response = await fetch(`${base}/${path.replace(/^\/+/, "")}`, { signal: AbortSignal.timeout(8000), headers: { Accept: "application/json" }, ...init });
      if (response.ok) {
        globalForErgast.__ergastBase = base;
        return response;
      }
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Base de resultados indisponível.");
}

export async function ergastJson<T = unknown>(path: string, revalidateSeconds = 300): Promise<T> {
  const response = await get(path, { next: { revalidate: revalidateSeconds }, cache: "no-store" });
  return (await response.json()) as T;
}

/** Fala a língua da resposta: o feed histórico traz `status` solto ou `Status.status`. */
export function raceStatus(entry: Record<string, unknown>): string {
  const nested = (entry.Status as { status?: string } | undefined)?.status;
  const flat = entry.status;
  return String(nested ?? flat ?? "").toLowerCase();
}
