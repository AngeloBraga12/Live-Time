import { test } from "node:test";
import assert from "node:assert/strict";
import { applyDelta, type Json } from "../src/lib/f1/merge";

test("atualiza item de array por índice sem perder os irmãos", () => {
  const state: Json = { Sectors: [{ Value: "28.1" }, { Value: "40.2" }, { Value: "27.3" }] };
  const next = applyDelta(state, { Sectors: { "1": { Value: "39.9", PersonalFastest: true } } }) as { Sectors: Array<Record<string, Json>> };
  assert.equal(next.Sectors.length, 3);
  assert.equal(next.Sectors[0].Value, "28.1");
  assert.deepEqual(next.Sectors[1], { Value: "39.9", PersonalFastest: true });
});

test("acrescenta nova mensagem de Race Control enviada como objeto indexado", () => {
  const state: Json = { Messages: [{ Message: "A" }, { Message: "B" }] };
  const next = applyDelta(state, { Messages: { "2": { Message: "C" } } }) as { Messages: Array<Record<string, Json>> };
  assert.deepEqual(next.Messages.map((m) => m.Message), ["A", "B", "C"]);
});

test("novo stint é criado no fim da lista", () => {
  const state: Json = { Lines: { "1": { Stints: [{ Compound: "SOFT", TotalLaps: 20 }] } } };
  const next = applyDelta(state, { Lines: { "1": { Stints: { "1": { Compound: "HARD", New: "true", TotalLaps: 0 } } } } }) as { Lines: Record<string, { Stints: Array<Record<string, Json>> }> };
  assert.equal(next.Lines["1"].Stints.length, 2);
  assert.equal(next.Lines["1"].Stints[1].Compound, "HARD");
});

test("objetos são mesclados em profundidade e _deleted remove chaves", () => {
  const state: Json = { Lines: { "1": { Position: "1", GapToLeader: "" }, "4": { Position: "2" } } };
  const next = applyDelta(state, { Lines: { "4": { Position: "1" }, "1": { Position: "2" } }, _deleted: [] }) as { Lines: Record<string, Record<string, Json>> };
  assert.equal(next.Lines["1"].Position, "2");
  assert.equal(next.Lines["1"].GapToLeader, "");
  assert.equal(next.Lines["4"].Position, "1");
  const removed = applyDelta({ A: 1, B: 2 }, { _deleted: ["A"] }) as Record<string, Json>;
  assert.deepEqual(removed, { B: 2 });
});
