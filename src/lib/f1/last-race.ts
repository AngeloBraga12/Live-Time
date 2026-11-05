import type { DriverTiming, LiveTimingSnapshot, SessionInfo, TeamId } from "@/types/live-timing";
import { ergastJson, raceStatus } from "./ergast";

/**
 * Fallback de última corrida quando o feed da F1 está no ar, sem sessão.
 *
 * O feed oficial de live timing (livetiming.formula1.com) só entrega dados
 * durante um fim de semana de GP; o arquivo estático de sessões passadas
 * responde HTTP 401 (ver docs/FEED-F1.md), então não existe replay pela API da
 * Fórmula 1. Para a página nunca ficar vazia usamos o resultado oficial da
 * última corrida, que é histórico e responde o tempo todo.
 *
 * O que chega aqui é resultado de corrida, não telemetria: tempos de setor e
 * pneus não existem nessa fonte, então ficam nulos em vez de inventados.
 */

const CACHE_MS = 6 * 60 * 60 * 1000;

const globalForArchive = globalThis as typeof globalThis & {
  __liveTimeLastRace?: { snapshot: LiveTimingSnapshot; at: number } | null;
};

/** constructorId da base histórica -> TeamId do app. */
function teamId(constructorId: string): TeamId {
  const key = constructorId.replace(/_/g, "-");
  if (key === "racing-bulls" || key === "alphatauri" || key === "visa-rb-crb-racing-bulls") return "rb";
  if (key === "haas-f1-team") return "haas";
  const known: string[] = ["mclaren", "ferrari", "red-bull", "mercedes", "aston-martin", "alpine", "williams", "rb", "sauber", "haas", "cadillac"];
  return (known as TeamId[]).includes(key as TeamId) ? (key as TeamId) : "unknown";
}

function abbreviate(givenName: string, familyName: string): string {
  const g = (givenName ?? "").toUpperCase();
  const f = (familyName ?? "").toUpperCase();
  if (!f) return (g || "PIL").slice(0, 3);
  return (f.slice(0, 2) + (g.slice(0, 1) || "X")).padEnd(3, "X");
}

type RawResult = {
  number?: string;
  position?: string;
  status?: string;
  laps?: string;
  Status?: { status?: string };
  Time?: { millis?: string; time?: string };
  Driver?: { driverId?: string; code?: string; givenName?: string; familyName?: string };
  Constructor?: { constructorId?: string; name?: string };
  FastestLap?: { Overall?: { Rank?: string }; Lap?: string; Time?: { millis?: string; time?: string } };
};

type RawRace = {
  season?: string;
  round?: string;
  raceName?: string;
  date?: string;
  time?: string;
  Circuit?: { circuitName?: string; Location?: { locality?: string; country?: string } };
  Results?: RawResult[];
};

function toSeconds(value: string | undefined): number | null {
  if (!value) return null;
  const parts = value.split(":");
  const seconds = Number(parts[parts.length - 1]);
  if (!Number.isFinite(seconds)) return null;
  if (parts.length === 1) return seconds;
  const minutes = Number(parts[parts.length - 2]);
  return Number.isFinite(minutes) ? minutes * 60 + seconds : seconds;
}

function finishedMillis(r: RawResult): number | null {
  if (raceStatus(r) !== "finished") return null;
  const millis = Number(r.Time?.millis);
  return Number.isFinite(millis) ? millis : null;
}

/** Gap para o líder (P1 = "LEADER") e intervalo para o antecessor na tabela. */
function gapsFrom(ordered: RawResult[]): { gap: string; interval: string }[] {
  const times = ordered.map(finishedMillis);
  const leader = times[0] ?? null;
  return ordered.map((r, index) => {
    const millis = times[index];
    if (millis === null) {
      const reason = raceStatus(r);
      return { gap: reason && reason !== "finished" ? `+ ${reason}` : "—", interval: "—" };
    }
    const gap = index === 0 || leader === null ? "LEADER" : `+${((millis - leader) / 1000).toFixed(3)}`;
    const before = index === 0 ? null : times[index - 1];
    const interval = before === null || before === undefined ? "—" : `+${((millis - before) / 1000).toFixed(3)}`;
    return { gap, interval };
  });
}

function emptySectors(): DriverTiming["sectors"] {
  return [
    { sector: 1, timeSeconds: null, status: "unknown" },
    { sector: 2, timeSeconds: null, status: "unknown" },
    { sector: 3, timeSeconds: null, status: "unknown" },
  ];
}

function mapResults(results: RawResult[], finishedAt: string): DriverTiming[] {
  const ordered = [...results].sort((a, b) => Number(a.position) - Number(b.position));
  const gaps = gapsFrom(ordered);
  return ordered.map((r, index) => {
    const fastest = r.FastestLap?.Overall?.Rank === "1" ? toSeconds(r.FastestLap?.Time?.time) : null;
    return {
      driverId: r.Driver?.driverId ?? `driver-${r.number ?? index + 1}`,
      position: Number(r.position),
      abbreviation: r.Driver?.code || abbreviate(r.Driver?.givenName ?? "", r.Driver?.familyName ?? ""),
      fullName: `${r.Driver?.givenName ?? ""} ${r.Driver?.familyName ?? ""}`.trim() || "Piloto",
      team: teamId(r.Constructor?.constructorId ?? ""),
      teamName: r.Constructor?.name ?? "Equipe",
      carNumber: Number(r.number ?? 0) || 0,
      completedLaps: Number(r.laps ?? 0) || 0,
      gapToLeader: gaps[index].gap,
      interval: gaps[index].interval,
      lastLapSeconds: null,
      bestLapSeconds: fastest,
      sectors: emptySectors(),
      tire: { compound: "UNKNOWN", ageLaps: null, condition: "used" },
      pitStatus: "unknown",
      updatedAt: finishedAt,
    } satisfies DriverTiming;
  });
}

function raceFinishedAt(race: RawRace): string {
  // A base devolve a hora de fim de prova em UTC ("20:00:00Z" ou "20:00:00").
  const time = (race.time ?? "").trim().replace(/Z$/i, "");
  const stamp = new Date(`${race.date ?? "1970-01-01"}T${time || "00:00:00"}Z`);
  return Number.isNaN(stamp.getTime())
    ? new Date(`${race.date ?? "1970-01-01"}T00:00:00Z`).toISOString()
    : stamp.toISOString();
}

/** Resultado oficial da última corrida disputada, no formato do painel ao vivo. */
export async function fetchLastRaceSnapshot(): Promise<LiveTimingSnapshot | null> {
  const cached = globalForArchive.__liveTimeLastRace;
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.snapshot;
  try {
    const payload = await ergastJson<{ MRData?: { RaceTable?: { Races?: RawRace[] } } }>("current/last/results.json", 6 * 60 * 60);
    const race = payload.MRData?.RaceTable?.Races?.[0];
    const results = race?.Results ?? [];
    if (!race || results.length === 0) return null;

    const finishedAt = raceFinishedAt(race);
    const session: SessionInfo = {
      eventName: race.raceName ?? "",
      meetingName: race.raceName ?? "",
      circuitName: race.Circuit?.circuitName ?? "",
      locality: race.Circuit?.Location?.locality ?? "",
      country: race.Circuit?.Location?.country ?? "",
      timezone: "UTC",
      sessionName: "Race",
      status: "finished",
      currentLap: 0,
      totalLaps: 0,
      scheduledStart: finishedAt,
      trackTemperatureC: null,
      airTemperatureC: null,
      trackFlag: "chequered",
    };

    const snapshot: LiveTimingSnapshot = {
      session,
      drivers: mapResults(results, finishedAt),
      raceControl: [{
        id: `result-${race.season}-${race.round}`,
        timestamp: finishedAt,
        severity: "info",
        category: "session",
        message: "Resultado oficial da última corrida. Setores e pneus não existem nessa fonte histórica.",
      }],
      emittedAt: finishedAt,
    };
    globalForArchive.__liveTimeLastRace = { snapshot, at: Date.now() };
    return snapshot;
  } catch {
    return null;
  }
}
