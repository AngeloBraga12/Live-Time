import { create } from "zustand";
import type { DriverTiming, LiveTimingSnapshot, RaceControlMessage, SessionInfo } from "@/types/live-timing";

const emptySession: SessionInfo = {
  eventName: "", meetingName: "", circuitName: "", locality: "", country: "", timezone: "", sessionName: "",
  status: "scheduled", currentLap: 0, totalLaps: 0, scheduledStart: "", trackTemperatureC: null, airTemperatureC: null, trackFlag: "unknown",
};

type ConnectionState = "connecting" | "live" | "offline";
interface LiveTimingState {
  session: SessionInfo;
  drivers: DriverTiming[];
  raceControl: RaceControlMessage[];
  connection: ConnectionState;
  lastUpdate: string | null;
  setConnection: (connection: ConnectionState) => void;
  applySnapshot: (snapshot: LiveTimingSnapshot) => void;
  applyTiming: (data: Pick<LiveTimingSnapshot, "drivers" | "session" | "emittedAt" | "raceControl">) => void;
  addRaceControl: (message: RaceControlMessage) => void;
}

export const useLiveTimingStore = create<LiveTimingState>((set) => ({
  session: emptySession, drivers: [], raceControl: [], connection: "connecting", lastUpdate: null,
  setConnection: (connection) => set({ connection }),
  applySnapshot: (snapshot) => set({ session: snapshot.session, drivers: snapshot.drivers, raceControl: snapshot.raceControl, lastUpdate: snapshot.emittedAt }),
  applyTiming: ({ drivers, session, raceControl, emittedAt }) => set({ drivers, session, raceControl, lastUpdate: emittedAt }),
  addRaceControl: (message) => set((state) => ({ raceControl: [message, ...state.raceControl].slice(0, 10) })),
}));
