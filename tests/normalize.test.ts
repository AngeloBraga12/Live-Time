import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildSnapshot, lapSeconds } from "../src/lib/f1/normalize";
import { applyDelta, type Json } from "../src/lib/f1/merge";
import type { FeedState } from "../src/lib/f1/feed";

// Estado real recebido do feed da F1 após o GP de Singapura 2026 (corrida).
const fixture = JSON.parse(readFileSync(new URL("./fixtures/singapore-2026-race.json", import.meta.url), "utf8")) as FeedState;

test("converte tempos de volta", () => {
  assert.equal(lapSeconds("1:36.282"), 96.282);
  assert.equal(lapSeconds({ Value: "28.713" }), 28.713);
  assert.equal(lapSeconds(""), null);
});

test("sessão: GP de Singapura, corrida encerrada", () => {
  const { session } = buildSnapshot(fixture, "2026-10-11T14:00:00Z");
  assert.equal(session.meetingName, "Singapore Grand Prix");
  assert.equal(session.sessionName, "Race");
  assert.equal(session.country, "Singapore");
  assert.equal(session.status, "finished");
  assert.equal(session.trackFlag, "chequered");
  assert.equal(session.currentLap, 62);
  assert.equal(session.totalLaps, 62);
  assert.equal(session.scheduledStart, "2026-10-11T20:00:00+08:00");
  assert.equal(Date.parse(session.scheduledStart), Date.parse("2026-10-11T12:00:00Z"));
});

test("pilotos ordenados por posição com dados completos", () => {
  const { drivers } = buildSnapshot(fixture, "2026-10-11T14:00:00Z");
  assert.ok(drivers.length >= 20);
  assert.deepEqual(drivers.slice(0, 5).map((d) => d.position), [1, 2, 3, 4, 5]);
  assert.equal(drivers[0].gapToLeader, "LEADER");
  const norris = drivers.find((d) => d.driverId === "1")!;
  assert.equal(norris.abbreviation, "NOR");
  assert.equal(norris.team, "mclaren");
  assert.equal(norris.teamColour, "#F47600");
  assert.equal(norris.gapToLeader, "+40.506");
  assert.equal(norris.bestLapSeconds, 96.282);
  assert.equal(norris.tire.compound, "MEDIUM");
  assert.equal(norris.tire.condition, "new");
  assert.equal(norris.sectors[0].timeSeconds, 28.713);
  assert.equal(norris.telemetry?.speedKph, 288);
});

test("Race Control: mais recente primeiro, com piloto identificado", () => {
  const { raceControl } = buildSnapshot(fixture, "2026-10-11T14:00:00Z");
  assert.ok(raceControl.length > 0 && raceControl.length <= 50);
  assert.ok(raceControl.some((m) => m.message === "CHEQUERED FLAG"));
  assert.ok(raceControl.every((m) => !Number.isNaN(Date.parse(m.timestamp))));
  const blue = raceControl.find((m) => m.message.includes("CAR 31"));
  assert.equal(blue?.subject, "OCO");
});

test("deltas ao vivo atualizam bandeira, voltas e posições", () => {
  const live = structuredClone(fixture) as Record<string, Json>;
  live.SessionStatus = applyDelta(live.SessionStatus, { Status: "Started" });
  live.TrackStatus = applyDelta(live.TrackStatus, { Status: "4", Message: "SCDeployed" });
  live.LapCount = applyDelta(live.LapCount, { CurrentLap: 30 });
  live.TimingData = applyDelta(live.TimingData, { Lines: { "1": { Position: "1", GapToLeader: "" }, [buildSnapshot(fixture, "").drivers[0].driverId]: { Position: "4" } } });
  const { session, drivers } = buildSnapshot(live as FeedState, "");
  assert.equal(session.status, "safety-car");
  assert.equal(session.trackFlag, "yellow");
  assert.equal(session.currentLap, 30);
  assert.equal(drivers.filter((d) => d.position === 1)[0].abbreviation, "NOR");
});
