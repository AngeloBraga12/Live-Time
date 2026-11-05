import { create } from "zustand";
import type { DriverTiming, LiveTimingSnapshot, RaceControlMessage, SessionInfo } from "@/types/live-timing";
import { readCachedSnapshot, writeCachedSnapshot } from "@/lib/client-cache";

const emptySession: SessionInfo = {
  eventName: "", meetingName: "", circuitName: "", locality: "", country: "", timezone: "", sessionName: "",
  status: "scheduled", currentLap: 0, totalLaps: 0, scheduledStart: "", trackTemperatureC: null, airTemperatureC: null, trackFlag: "unknown",
};

/**
 * live       = feed conectado e enviando
 * cached     = feed sem sessão/no ar; a tela mostra a última classificação guardada
 * connecting = primeira conexão ainda sem resposta
 * offline    = sem feed e sem nenhuma cópia para mostrar
 */
export type ConnectionState = "connecting" | "live" | "cached" | "offline";
interface LiveTimingState {
  session: SessionInfo;
  drivers: DriverTiming[];
  raceControl: RaceControlMessage[];
  connection: ConnectionState;
  lastUpdate: string | null;
  /** Quando a tela mostra uma cópia, o momento em que ela foi registrada. */
  cachedAt: string | null;
  setConnection: (connection: ConnectionState) => void;
  applySnapshot: (snapshot: LiveTimingSnapshot, options?: { cached?: boolean }) => void;
  applyTiming: (data: Pick<LiveTimingSnapshot, "drivers" | "session" | "emittedAt" | "raceControl">) => void;
  /** Restaura a última classificação deste navegador antes de o feed responder. */
  hydrateFromCache: () => void;
}

export const useLiveTimingStore = create<LiveTimingState>((set, get) => ({
  session: emptySession, drivers: [], raceControl: [], connection: "connecting", lastUpdate: null, cachedAt: null,
  setConnection: (connection) => set({ connection }),
  applySnapshot: (snapshot, options) => {
    if (!options?.cached) writeCachedSnapshot(snapshot);
    set({
      session: snapshot.session, drivers: snapshot.drivers, raceControl: snapshot.raceControl,
      lastUpdate: snapshot.emittedAt, cachedAt: options?.cached ? snapshot.emittedAt : null,
    });
  },
  applyTiming: ({ drivers, session, raceControl, emittedAt }) => {
    set({ drivers, session, raceControl, lastUpdate: emittedAt, cachedAt: null });
    writeCachedSnapshot({ session, drivers, raceControl, emittedAt } as LiveTimingSnapshot);
  },
  hydrateFromCache: () => {
    const entry = readCachedSnapshot();
    if (!entry) return;
    // Não cobre dados que já chegaram ao vivo.
    if (get().connection === "live" || get().drivers.length > 0) return;
    set({
      session: entry.snapshot.session, drivers: entry.snapshot.drivers, raceControl: entry.snapshot.raceControl,
      lastUpdate: entry.snapshot.emittedAt, cachedAt: entry.storedAt, connection: "cached",
    });
  },
}));
