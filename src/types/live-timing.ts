export type DriverId = string;

export type TeamId =
  | "mclaren" | "ferrari" | "red-bull" | "mercedes" | "aston-martin"
  | "alpine" | "williams" | "rb" | "sauber" | "haas" | "cadillac" | "unknown";

export type TireCompound = "UNKNOWN" | "SOFT" | "MEDIUM" | "HARD" | "INTERMEDIATE" | "WET";
export type TireCondition = "new" | "used";
export type TrackFlag = "unknown" | "green" | "yellow" | "double-yellow" | "red" | "blue" | "chequered";
export type SectorStatus = "personal-best" | "session-best" | "normal" | "unknown";
export type SessionStatus = "scheduled" | "green" | "safety-car" | "virtual-safety-car" | "red-flag" | "chequered" | "finished";
export type RaceControlSeverity = "info" | "warning" | "critical" | "green";

export interface SectorTime {
  sector: 1 | 2 | 3;
  /** Seconds to three decimal places; null means the sector is not complete. */
  timeSeconds: number | null;
  status: SectorStatus;
}

export interface TireState {
  compound: TireCompound;
  ageLaps: number | null;
  condition: TireCondition;
  /** Estimated remaining life in laps; omit when the feed has no estimate. */
  estimatedLifeLaps?: number;
}

export interface DriverTiming {
  driverId: DriverId;
  position: number | null;
  previousPosition?: number;
  abbreviation: string;
  fullName: string;
  team: TeamId;
  teamName: string;
  teamColour?: string;
  carNumber: number;
  completedLaps: number;
  /** Leader gap, or "LEADER" for P1. */
  gapToLeader: string;
  interval: string;
  lastLapSeconds: number | null;
  bestLapSeconds: number | null;
  sectors: [SectorTime, SectorTime, SectorTime];
  tire: TireState;
  pitStatus: "unknown" | "track" | "pit-lane" | "in-pit";
  /** Normalized 0–1 throttle and brake telemetry when available. */
  telemetry?: { throttle?: number; brake?: number; speedKph?: number; gear?: number };
  updatedAt: string;
}

export interface RaceControlMessage {
  id: string;
  timestamp: string;
  lap?: number;
  severity: RaceControlSeverity;
  category: "track-status" | "incident" | "penalty" | "pit-lane" | "weather" | "session";
  message: string;
  /** Optional subject, such as a driver abbreviation or corner number. */
  subject?: string;
}

export interface SessionInfo {
  eventName: string;
  meetingName: string;
  circuitName: string;
  locality: string;
  country: string;
  timezone: string;
  sessionName: string;
  status: SessionStatus;
  currentLap: number;
  totalLaps: number;
  /** ISO-8601 string with explicit offset. 15:00 Austin = 20:00 UTC. */
  scheduledStart: string;
  trackTemperatureC: number | null;
  airTemperatureC: number | null;
  trackFlag: TrackFlag;
}

export interface LiveTimingSnapshot {
  session: SessionInfo;
  drivers: DriverTiming[];
  raceControl: RaceControlMessage[];
  /** Server event time in ISO-8601. */
  emittedAt: string;
}

export interface LiveTimingPollResponse {
  connected: boolean;
  lastMessageAt: string | null;
  snapshot?: LiveTimingSnapshot;
  error?: string;
}

export type LiveTimingEvent =
  | { type: "snapshot"; data: LiveTimingSnapshot }
  | { type: "timing-update"; data: Pick<LiveTimingSnapshot, "drivers" | "session" | "raceControl" | "emittedAt"> }
  | { type: "race-control"; data: RaceControlMessage }
  | { type: "provider-status"; data: { connected: boolean; lastMessageAt: string | null } }
  | { type: "heartbeat"; data: { emittedAt: string } }
  | { type: "provider-error"; data: { status: number } };
