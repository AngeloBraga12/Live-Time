import type { DriverTiming, LiveTimingSnapshot, RaceControlMessage, RaceControlSeverity, SectorStatus, SessionInfo, SessionStatus, TeamId, TireCompound, TrackFlag } from "@/types/live-timing";
import type { FeedState } from "./feed";

/**
 * Converte o estado bruto do feed da F1 (nomes em PascalCase, valores em texto)
 * no formato usado pelo painel (`LiveTimingSnapshot`).
 */

type Row = Record<string, unknown>;

function row(value: unknown): Row { return value && typeof value === "object" && !Array.isArray(value) ? value as Row : {}; }
function list(value: unknown): unknown[] { return Array.isArray(value) ? value : Object.values(row(value)); }
function pick(...values: unknown[]): unknown { return values.find((value) => value !== undefined && value !== null && value !== ""); }
function text(value: unknown, fallback = ""): string { return value == null || value === "" ? fallback : String(value); }
function number(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}
function bool(value: unknown): boolean { return value === true || value === "true"; }
function valueOf(value: unknown): unknown { return value && typeof value === "object" && !Array.isArray(value) ? (value as Row).Value : value; }

/** "1:36.282" → 96.282, "28.713" → 28.713 */
export function lapSeconds(value: unknown): number | null {
  const raw = valueOf(value);
  const direct = number(raw);
  if (direct != null) return direct;
  if (typeof raw !== "string") return null;
  const match = raw.trim().match(/^(?:(\d+):)?(\d{1,2})\.(\d{1,3})$/);
  if (!match) return null;
  return Number(match[1] ?? 0) * 60 + Number(match[2]) + Number(`0.${match[3]}`);
}

function teamId(teamName: string): TeamId {
  const key = teamName.toLowerCase();
  if (key.includes("mclaren")) return "mclaren";
  if (key.includes("ferrari")) return "ferrari";
  if (key.includes("red bull")) return "red-bull";
  if (key.includes("mercedes")) return "mercedes";
  if (key.includes("aston martin")) return "aston-martin";
  if (key.includes("alpine")) return "alpine";
  if (key.includes("williams")) return "williams";
  if (key.includes("racing bulls") || key === "rb") return "rb";
  if (key.includes("sauber") || key.includes("audi")) return "sauber";
  if (key.includes("haas")) return "haas";
  if (key.includes("cadillac")) return "cadillac";
  return "unknown";
}

function teamColour(value: unknown): string | undefined {
  const colour = text(value).replace(/^#/, "");
  return /^[\da-f]{6}$/i.test(colour) ? `#${colour}` : undefined;
}

function sectorStatus(value: unknown): SectorStatus {
  const sector = row(value);
  if (sector.OverallFastest === true) return "session-best";
  if (sector.PersonalFastest === true) return "personal-best";
  return text(sector.Value) ? "normal" : "unknown";
}

function compound(value: unknown): TireCompound {
  const name = text(value).toUpperCase();
  return ["SOFT", "MEDIUM", "HARD", "INTERMEDIATE", "WET"].includes(name) ? name as TireCompound : "UNKNOWN";
}

/** Junta DriverList + TimingAppData + TimingData + TimingStats por número do carro. */
export function mergedLines(state: FeedState): Record<string, Row> {
  const drivers = row(state.DriverList);
  const timing = row(row(state.TimingData).Lines);
  const app = row(row(state.TimingAppData).Lines);
  const stats = row(row(state.TimingStats).Lines);
  const numbers = new Set([...Object.keys(drivers), ...Object.keys(timing), ...Object.keys(app)].filter((key) => key !== "_kf"));
  const lines: Record<string, Row> = {};
  for (const racingNumber of numbers) {
    const statsLine = row(stats[racingNumber]);
    lines[racingNumber] = {
      ...row(drivers[racingNumber]),
      ...row(app[racingNumber]),
      ...row(timing[racingNumber]),
      PersonalBestLapTime: statsLine.PersonalBestLapTime,
      RacingNumber: racingNumber,
    };
  }
  return lines;
}

function mapDriver(racingNumber: string, line: Row, sessionType: string, sessionPart: number | null, index: number, updatedAt: string): DriverTiming {
  const sectors = list(line.Sectors);
  const stints = list(line.Stints);
  const stint = row(stints[stints.length - 1]);
  const teamName = text(line.TeamName, "Unknown");
  const position = number(line.Position) ?? index + 1;
  // Type é "Race" para corrida e sprint; "Qualifying" para quali e sprint quali; "Practice" para treinos.
  const isRace = sessionType.toLowerCase() === "race";

  // Qualificação: Stats/BestLapTimes vêm por parte (Q1, Q2, Q3).
  const partIndex = sessionPart ? sessionPart - 1 : -1;
  const partStats = partIndex >= 0 ? row(list(line.Stats)[partIndex]) : {};
  const partBest = partIndex >= 0 ? list(line.BestLapTimes)[partIndex] : undefined;

  const out = bool(line.Retired) || bool(line.Stopped) || bool(line.KnockedOut);
  const leaderLabel = position === 1 ? "LEADER" : "—";
  const gap = out ? (bool(line.Retired) ? "OUT" : bool(line.KnockedOut) ? "KO" : "STOP")
    : text(isRace ? valueOf(line.GapToLeader) : pick(valueOf(partStats.TimeDiffToFastest), valueOf(line.TimeDiffToFastest), valueOf(line.GapToLeader)), leaderLabel);
  const interval = text(isRace
    ? valueOf(line.IntervalToPositionAhead)
    : pick(valueOf(partStats.TimeDifftoPositionAhead), valueOf(partStats.TimeDiffToPositionAhead), valueOf(line.TimeDiffToPositionAhead), valueOf(line.IntervalToPositionAhead)), "—");

  const speeds = row(line.Speeds);
  const speed = number(valueOf(speeds.ST)) ?? number(valueOf(speeds.FL));
  const ageLaps = number(stint.TotalLaps);

  return {
    driverId: racingNumber,
    position,
    abbreviation: text(line.Tla, `#${racingNumber}`),
    fullName: text(line.FullName, text(line.BroadcastName, `Car ${racingNumber}`)),
    team: teamId(teamName),
    teamName,
    teamColour: teamColour(line.TeamColour),
    carNumber: number(line.RacingNumber) ?? Number(racingNumber),
    completedLaps: number(line.NumberOfLaps) ?? 0,
    gapToLeader: gap === "" ? leaderLabel : gap,
    interval,
    lastLapSeconds: lapSeconds(line.LastLapTime),
    bestLapSeconds: lapSeconds(partBest) ?? lapSeconds(line.BestLapTime) ?? lapSeconds(line.PersonalBestLapTime),
    sectors: ([0, 1, 2] as const).map((i) => ({ sector: (i + 1) as 1 | 2 | 3, timeSeconds: lapSeconds(sectors[i]), status: sectorStatus(sectors[i]) })) as DriverTiming["sectors"],
    tire: { compound: compound(stint.Compound), ageLaps, condition: bool(stint.New) ? "new" : "used" },
    pitStatus: bool(line.InPit) ? "in-pit" : bool(line.PitOut) ? "pit-lane" : out ? "unknown" : "track",
    telemetry: speed == null ? undefined : { speedKph: speed },
    updatedAt,
  };
}

export function mapDrivers(state: FeedState, updatedAt = new Date().toISOString()): DriverTiming[] {
  const lines = mergedLines(state);
  const sessionType = text(row(state.SessionInfo).Type);
  const sessionPart = number(row(state.TimingData).SessionPart);
  return Object.keys(lines)
    .sort((a, b) => (number(lines[a].Position) ?? number(lines[a].Line) ?? 999) - (number(lines[b].Position) ?? number(lines[b].Line) ?? 999) || Number(a) - Number(b))
    .map((racingNumber, index) => mapDriver(racingNumber, lines[racingNumber], sessionType, sessionPart, index, updatedAt));
}

function severity(message: Row): RaceControlSeverity {
  const flag = text(message.Flag).toUpperCase();
  const body = text(message.Message).toUpperCase();
  if (flag === "RED" || body.includes("RED FLAG")) return "critical";
  if (flag.includes("YELLOW") || body.includes("SAFETY CAR") || body.includes("PENALTY") || body.includes("INVESTIGATION")) return "warning";
  if (flag === "GREEN" || flag === "CLEAR" || body.includes("GREEN LIGHT")) return "green";
  return "info";
}

function category(message: Row): RaceControlMessage["category"] {
  const kind = text(message.Category).toUpperCase();
  const body = text(message.Message).toUpperCase();
  if (body.includes("PENALTY")) return "penalty";
  if (body.includes("INVESTIGATION") || body.includes("NOTED") || kind === "CAREVENT") return "incident";
  if (body.includes("PIT EXIT") || body.includes("PIT LANE") || body.includes("PIT ENTRY")) return "pit-lane";
  if (body.includes("RAIN") || body.includes("WEATHER") || body.includes("SLIPPERY")) return "weather";
  if (kind === "FLAG" || kind === "SAFETYCAR" || kind === "DRS") return "track-status";
  return "session";
}

export function mapRaceControl(state: FeedState, lines: Record<string, Row>): RaceControlMessage[] {
  return list(row(state.RaceControlMessages).Messages).map((item, index) => {
    const message = row(item);
    const lap = number(message.Lap);
    const body = text(message.Message, text(message.Flag, "Race control"));
    const car = text(message.RacingNumber);
    const subject = car ? text(lines[car]?.Tla, `#${car}`) : message.Sector != null ? `SETOR ${message.Sector}` : undefined;
    return {
      id: `rc-${index}-${text(message.Utc)}`,
      timestamp: /Z$|[+-]\d\d:?\d\d$/.test(text(message.Utc)) ? text(message.Utc) : text(message.Utc) ? `${text(message.Utc)}Z` : "",
      ...(lap == null ? {} : { lap }),
      severity: severity(message),
      category: category(message),
      message: body,
      subject,
    };
  }).slice(-50).reverse();
}

/** TrackStatus: 1 pista livre, 2 amarela, 4 safety car, 5 vermelha, 6 VSC, 7 fim do VSC. */
function trackFlag(trackStatus: string, sessionFinished: boolean): TrackFlag {
  if (sessionFinished) return "chequered";
  switch (trackStatus) {
    case "1": return "green";
    case "2": return "yellow";
    case "4": case "6": case "7": return "yellow";
    case "5": return "red";
    default: return "unknown";
  }
}

/** "2026-10-11T20:00:00" + "08:00:00" → "2026-10-11T20:00:00+08:00" */
function withOffset(local: string, gmtOffset: string): string {
  if (!local) return "";
  const match = gmtOffset.match(/^(-)?(\d{1,2}):(\d{2})/);
  if (!match) return local;
  return `${local}${match[1] ? "-" : "+"}${match[2].padStart(2, "0")}:${match[3]}`;
}

export function mapSession(state: FeedState): SessionInfo {
  const session = row(state.SessionInfo);
  const meeting = row(session.Meeting);
  const lapCount = row(state.LapCount);
  const weather = row(state.WeatherData);
  const rawStatus = text(pick(row(state.SessionStatus).Status, session.SessionStatus)).toLowerCase();
  const track = text(row(state.TrackStatus).Status);
  const finished = ["finished", "finalised", "ends"].includes(rawStatus);
  const flag = trackFlag(track, finished);

  let status: SessionStatus;
  if (finished) status = "finished";
  else if (rawStatus === "aborted" || track === "5") status = "red-flag";
  else if (track === "6" || track === "7") status = "virtual-safety-car";
  else if (track === "4") status = "safety-car";
  else if (rawStatus === "started") status = "green";
  else status = "scheduled";

  const meetingName = text(pick(meeting.Name, meeting.OfficialName), "");
  return {
    eventName: text(meeting.OfficialName, meetingName),
    meetingName,
    circuitName: text(row(meeting.Circuit).ShortName),
    locality: text(meeting.Location),
    country: text(row(meeting.Country).Name),
    timezone: text(session.GmtOffset) ? `UTC${text(session.GmtOffset).startsWith("-") ? "" : "+"}${text(session.GmtOffset).slice(0, 5)}` : "UTC",
    sessionName: text(session.Name, "Live Session"),
    status,
    currentLap: number(lapCount.CurrentLap) ?? 0,
    totalLaps: number(lapCount.TotalLaps) ?? 0,
    scheduledStart: withOffset(text(session.StartDate), text(session.GmtOffset)),
    trackTemperatureC: number(weather.TrackTemp),
    airTemperatureC: number(weather.AirTemp),
    trackFlag: flag,
  };
}

export function buildSnapshot(state: FeedState, emittedAt: string): LiveTimingSnapshot {
  const lines = mergedLines(state);
  const raceControl = mapRaceControl(state, lines);
  return { session: mapSession(state), drivers: mapDrivers(state, emittedAt), raceControl, emittedAt };
}
