import type { DriverTiming, LiveTimingSnapshot, RaceControlMessage, RaceControlSeverity, SectorStatus, SessionStatus, TeamId, TireCompound, TrackFlag } from "@/types/live-timing";

type Row = Record<string, unknown>;
export type F1LiveApiHealth = { service: string; connected: boolean; status: string; lastMessageAt: string | null; uptimeSeconds: number | null; timestamp: string | null; apiBaseUrl: string };

// A API roda no mesmo container/processo-pai do site (scripts/run-site.mjs) e é
// consumida por loopback. F1_LIVETIMING_API_URL só precisa ser definida quando
// a API estiver hospedada em outro lugar.
const configuredApiBaseUrl = process.env.F1_LIVETIMING_API_URL?.trim();
export const apiBaseUrl = (configuredApiBaseUrl || "http://127.0.0.1:3001").replace(/\/+$/, "");

function row(value: unknown): Row { return value && typeof value === "object" && !Array.isArray(value) ? value as Row : {}; }
function pick(...values: unknown[]): unknown { return values.find((value) => value !== undefined && value !== null && value !== ""); }
function text(value: unknown, fallback = ""): string { return value == null ? fallback : String(value); }
function number(value: unknown): number | null { if (typeof value === "number" && Number.isFinite(value)) return value; if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value); return null; }
function valueOf(value: unknown): unknown { return row(value).Value ?? value; }
function seconds(value: unknown): number | null {
  const raw = valueOf(value);
  const direct = number(raw);
  if (direct != null) return direct;
  if (typeof raw !== "string") return null;
  const match = raw.trim().match(/^(?:(\d+):)?(\d{1,2})\.(\d{1,3})$/);
  if (!match) return null;
  return Number(match[1] ?? 0) * 60 + Number(match[2]) + Number(`0.${match[3]}`);
}
function racingNumbers(lines: Row, leaderboard: unknown): string[] {
  const source = Array.isArray(leaderboard) ? leaderboard.map(String) : Object.keys(lines);
  return source.sort((a, b) => (number(row(lines[a]).Position) ?? 999) - (number(row(lines[b]).Position) ?? 999));
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
  return valueOf(value) == null ? "unknown" : "normal";
}
function latestStint(value: unknown): Row {
  const stints = Array.isArray(value) ? value : Object.values(row(value));
  return row(stints[stints.length - 1]);
}
function normalizeCompound(value: unknown): TireCompound {
  const compound = text(value).toUpperCase();
  return ["SOFT", "MEDIUM", "HARD", "INTERMEDIATE", "WET"].includes(compound) ? compound as TireCompound : "UNKNOWN";
}

function mapDrivers(payload: Row): DriverTiming[] {
  const lines = row(payload.Lines);
  return racingNumbers(lines, payload.Leaderboard).map((racingNumber, index) => {
    const line = row(lines[racingNumber]);
    const sectors = row(line.Sectors);
    const stint = latestStint(line.Stints);
    const teamName = text(line.TeamName, "Unknown");
    const position = number(line.Position) ?? index + 1;
    const gap = text(valueOf(line.GapToLeader), position === 1 ? "LEADER" : "—");
    const speed = number(valueOf(row(line.Speeds).ST)) ?? number(valueOf(row(line.Speeds).FL));
    const lastLap = seconds(line.LastLapTime);
    const bestLap = seconds(line.BestLapTime);
    const inPit = line.InPit === true;
    const newSet = stint.New === true;
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
      gapToLeader: gap === "LEADER" ? gap : gap,
      interval: text(valueOf(line.IntervalToPositionAhead), "—"),
      lastLapSeconds: lastLap,
      bestLapSeconds: bestLap,
      sectors: ([0, 1, 2] as const).map((sectorIndex) => ({ sector: (sectorIndex + 1) as 1 | 2 | 3, timeSeconds: seconds(sectors[String(sectorIndex)]), status: sectorStatus(sectors[String(sectorIndex)]) })) as DriverTiming["sectors"],
      tire: { compound: normalizeCompound(stint.Compound), ageLaps: number(stint.TotalLaps), condition: newSet ? "new" : "used" },
      pitStatus: inPit ? "in-pit" : line.PitOut === true ? "track" : "unknown",
      telemetry: speed == null ? undefined : { speedKph: speed },
      updatedAt: text(line.Utc, new Date().toISOString()),
    };
  });
}

function normalizeTrackFlag(messages: unknown[]): TrackFlag {
  const latest = row(messages[messages.length - 1]);
  const flag = text(latest.Flag).toUpperCase();
  const message = text(latest.Message).toUpperCase();
  const combined = `${flag} ${message}`;
  if (combined.includes("CHEQUERED") || combined.includes("CHEQUER")) return "chequered";
  if (combined.includes("RED FLAG") || flag === "RED") return "red";
  if (combined.includes("DOUBLE YELLOW")) return "double-yellow";
  if (combined.includes("YELLOW") || combined.includes("SAFETY CAR") || flag === "SC" || flag === "VSC") return "yellow";
  if (combined.includes("GREEN") || flag === "GREEN") return "green";
  if (combined.includes("BLUE") || flag === "BLUE") return "blue";
  return "unknown";
}

function mapSeverity(message: Row): RaceControlSeverity {
  const flag = text(message.Flag).toUpperCase();
  const body = text(message.Message).toUpperCase();
  if (flag === "RED" || body.includes("RED FLAG")) return "critical";
  if (flag.includes("YELLOW") || flag === "SC" || flag === "VSC" || body.includes("PENALTY") || body.includes("SAFETY CAR")) return "warning";
  if (flag === "GREEN" || body.includes("GREEN FLAG")) return "green";
  return "info";
}

function mapRaceControl(value: unknown): RaceControlMessage[] {
  const raw = row(value).RaceControl;
  const messages = Array.isArray(raw) ? raw : Object.values(row(raw));
  return messages.map((item, index) => {
    const message = row(item);
    const lap = number(message.Lap);
    const body = text(message.Message, text(message.Flag, "Race control update"));
    const flag = text(message.Flag).toUpperCase();
    const category: RaceControlMessage["category"] = body.toUpperCase().includes("PENALTY") ? "penalty" : body.toUpperCase().includes("PIT") ? "pit-lane" : body.toUpperCase().includes("WEATHER") ? "weather" : flag ? "track-status" : "session";
    return { id: `f1-${text(message.Utc, "event")}-${index}-${body.slice(0, 12)}`, timestamp: text(message.Utc, text(message.Timestamp, "")), ...(lap == null ? {} : { lap }), severity: mapSeverity(message), category, message: body, subject: text(message.Scope, text(message.RacingNumber, "")) || undefined };
  }).slice(-50).reverse();
}

function mapSession(value: unknown, lapCountValue: unknown, weatherValue: unknown, raceControl: RaceControlMessage[], connected: boolean): LiveTimingSnapshot["session"] {
  const session = row(row(value).Session);
  const meeting = row(session.Meeting);
  const lapCount = row(row(lapCountValue).LapCount);
  const weather = row(row(weatherValue).Weather);
  const currentLap = number(lapCount.CurrentLap) ?? 0;
  const rawStatus = text(pick(session.Status, session.SessionStatus, session.SessionState)).toLowerCase();
  const trackFlag = normalizeTrackFlag(raceControl.map((message) => ({ Flag: message.category === "track-status" ? message.message : "", Message: message.message })));
  const latestMessage = raceControl[0]?.message.toUpperCase() ?? "";
  const status: SessionStatus = rawStatus.includes("finish") || rawStatus.includes("complete") || trackFlag === "chequered" ? "finished" : rawStatus.includes("abort") || trackFlag === "red" ? "red-flag" : latestMessage.includes("VSC") ? "virtual-safety-car" : latestMessage.includes("SAFETY CAR") || latestMessage.includes("SC DEPLOYED") ? "safety-car" : connected && currentLap > 0 ? "green" : "scheduled";
  const meetingName = text(pick(meeting.OfficialName, meeting.Name, session.MeetingName, session.EventName), "Formula 1 Live Session");
  const sessionName = text(pick(session.Name, session.SessionName, row(session.SessionType).Name, session.SessionType), "Live Session");
  const start = text(pick(session.StartDate, session.StartTime), "");
  return {
    eventName: meetingName,
    meetingName,
    circuitName: text(pick(row(meeting.Circuit).ShortName, row(meeting.Circuit).Name, meeting.Circuit, meeting.Location), ""),
    locality: text(pick(meeting.Location, meeting.Locality), ""),
    country: text(pick(row(meeting.Country).Name, meeting.Country), ""),
    timezone: "UTC",
    sessionName,
    status,
    currentLap,
    totalLaps: number(lapCount.TotalLaps) ?? 0,
    scheduledStart: start,
    trackTemperatureC: number(weather.TrackTemp),
    airTemperatureC: number(weather.AirTemp),
    trackFlag,
  };
}

export async function fetchF1LiveJson(path: string): Promise<unknown> {
  const response = await fetch(`${apiBaseUrl}/api/${path.replace(/^\/+/, "")}`, { cache: "no-store", signal: AbortSignal.timeout(3500), headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`f1-livetiming-api respondeu HTTP ${response.status} em /api/${path}.`);
  return response.json() as Promise<unknown>;
}

export async function fetchF1LiveHealth(): Promise<F1LiveApiHealth> {
  const raw = row(await fetchF1LiveJson("status"));
  const connected = raw.isConnected === true || text(raw.status).toUpperCase() === "CONNECTED";
  return { service: text(raw.service, "f1-livetiming-api"), connected, status: text(raw.status, connected ? "CONNECTED" : "DISCONNECTED"), lastMessageAt: text(raw.lastMessageAt) || null, uptimeSeconds: number(raw.uptimeSeconds), timestamp: text(raw.timestamp) || null, apiBaseUrl };
}

export async function fetchF1LiveSnapshot(health?: F1LiveApiHealth): Promise<LiveTimingSnapshot> {
  const status = health ?? await fetchF1LiveHealth();
  if (!status.connected) throw new Error("A f1-livetiming-api ainda não está conectada ao feed F1 SignalR.");
  const [leaderboardValue, weatherValue, raceValue] = await Promise.all([fetchF1LiveJson("leaderboard"), fetchF1LiveJson("weather"), fetchF1LiveJson("race-control")]);
  const leaderboard = row(leaderboardValue);
  const drivers = mapDrivers(leaderboard);
  const raceControl = mapRaceControl(raceValue);
  return { session: mapSession({ Session: leaderboard.Session }, { LapCount: leaderboard.LapCount }, weatherValue, raceControl, status.connected), drivers, raceControl, emittedAt: status.lastMessageAt ?? new Date().toISOString() };
}
