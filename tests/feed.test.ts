import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { WebSocketServer, type WebSocket } from "ws";

/**
 * Servidor SignalR falso que imita a F1: negotiate, handshake, resposta da
 * assinatura com o estado completo e deltas no canal "feed".
 */
const fixture = JSON.parse(readFileSync(new URL("./fixtures/singapore-2026-race.json", import.meta.url), "utf8"));
const RS = "\x1e";

test("conecta, recebe estado completo e aplica deltas ao vivo", async () => {
  const sockets: WebSocket[] = [];
  const server = createServer((req, res) => {
    if (req.url?.startsWith("/signalrcore/negotiate")) {
      res.setHeader("Set-Cookie", "AWSALBCORS=abc; Path=/");
      res.end(req.method === "POST" ? JSON.stringify({ connectionToken: "tok", connectionId: "id", negotiateVersion: 1, availableTransports: [] }) : "");
      return;
    }
    res.statusCode = 404; res.end();
  });
  const wss = new WebSocketServer({ server });
  let cookie = "";
  wss.on("connection", (ws, req) => {
    cookie = String(req.headers.cookie);
    sockets.push(ws);
    ws.on("message", (raw) => {
      for (const part of raw.toString().split(RS).filter(Boolean)) {
        const msg = JSON.parse(part);
        if (msg.protocol) ws.send(`{}${RS}`);
        if (msg.target === "Subscribe") {
          const live = { ...fixture, SessionStatus: { Status: "Started" }, TrackStatus: { Status: "1" }, LapCount: { CurrentLap: 10, TotalLaps: 62 } };
          ws.send(JSON.stringify({ type: 3, invocationId: "0", result: live }) + RS);
        }
      }
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  process.env.F1_SIGNALR_URL = `http://127.0.0.1:${(server.address() as AddressInfo).port}/signalrcore`;

  const { f1Feed } = await import("../src/lib/f1/feed");
  const { buildSnapshot } = await import("../src/lib/f1/normalize");

  await f1Feed.ensure();
  assert.equal(f1Feed.getStatus().connected, true);
  assert.equal(cookie, "AWSALBCORS=abc");
  let snap = buildSnapshot(f1Feed.getState(), "");
  assert.equal(snap.session.status, "green");
  assert.equal(snap.session.currentLap, 10);

  // Deltas: safety car, nova volta, setor do líder e nova mensagem de Race Control.
  const changed = new Promise<void>((resolve) => { const off = f1Feed.subscribe(() => { off(); resolve(); }); });
  const leader = snap.drivers[0].driverId;
  const rcCount = (fixture.RaceControlMessages.Messages as unknown[]).length;
  const deltas = [
    ["TrackStatus", { Status: "4", Message: "SCDeployed" }],
    ["LapCount", { CurrentLap: 11 }],
    ["TimingData", { Lines: { [leader]: { Sectors: { "0": { Value: "27.999", OverallFastest: true } } } } }],
    ["RaceControlMessages", { Messages: { [rcCount]: { Utc: "2026-10-11T12:30:00", Lap: 11, Category: "SafetyCar", Message: "SAFETY CAR DEPLOYED" } } }],
  ];
  sockets[0].send(deltas.map(([topic, data]) => JSON.stringify({ type: 1, target: "feed", arguments: [topic, data, "2026-10-11T12:30:00Z"] })).join(RS) + RS);
  await changed;

  snap = buildSnapshot(f1Feed.getState(), "");
  assert.equal(snap.session.status, "safety-car");
  assert.equal(snap.session.currentLap, 11);
  const first = snap.drivers.find((d) => d.driverId === leader)!;
  assert.equal(first.sectors[0].timeSeconds, 27.999);
  assert.equal(first.sectors[0].status, "session-best");
  assert.equal(first.sectors[1].timeSeconds != null, true, "outros setores preservados");
  assert.equal(snap.raceControl[0].message, "SAFETY CAR DEPLOYED");

  // Queda da conexão com alguém assistindo: reconecta sozinho.
  const off = f1Feed.subscribe(() => undefined);
  sockets[0].terminate();
  await new Promise((resolve) => setTimeout(resolve, 2600));
  assert.equal(sockets.length, 2, "abriu nova conexão");
  assert.equal(f1Feed.getStatus().connected, true);
  off();

  for (const ws of sockets) ws.terminate();
  wss.close(); server.close();
});
