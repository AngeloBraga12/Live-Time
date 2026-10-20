/**
 * Aplica os deltas do feed SignalR da F1 sobre o estado em memória.
 *
 * O feed manda o estado completo na assinatura e depois só o que mudou. Listas
 * (setores, stints, mensagens de Race Control, rádios) chegam como array no
 * estado inicial e como objeto indexado nos deltas, por exemplo
 * `{ "Sectors": { "1": { "Value": "28.341" } } }`. Este merge atualiza a posição
 * certa do array em vez de substituí-lo por um objeto.
 */
export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
type JsonObject = { [key: string]: Json };

export function isObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isIndexKey(key: string): boolean {
  return /^\d+$/.test(key);
}

export function applyDelta(target: Json | undefined, delta: Json): Json {
  if (Array.isArray(delta)) return delta.map((item) => applyDelta(undefined, item));
  if (!isObject(delta)) return delta;

  if (Array.isArray(target)) {
    const keys = Object.keys(delta);
    if (keys.every(isIndexKey)) {
      const next = target.slice();
      for (const key of keys) next[Number(key)] = applyDelta(next[Number(key)], delta[key]);
      return next;
    }
    target = { ...target };
  }

  const base: JsonObject = isObject(target) ? target : {};
  for (const [key, value] of Object.entries(delta)) {
    if (key === "_deleted" && Array.isArray(value)) {
      for (const removed of value) delete base[String(removed)];
      continue;
    }
    base[key] = applyDelta(base[key], value);
  }
  return base;
}
