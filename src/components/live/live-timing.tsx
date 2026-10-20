"use client";

import { useState } from "react";
import { useLiveTiming } from "@/hooks/use-live-timing";
import { feedMatchesEvent, useCalendar } from "@/hooks/use-calendar";
import { useLiveTimingStore } from "@/store/live-timing-store";
import { isRaceSession, isSessionOver, isSessionRunning, sessionLabel, trackState } from "@/lib/format";
import { EventHero, SessionHero } from "@/components/live/hero";
import { TimingTable, TimingTableSkeleton } from "@/components/live/timing-table";
import { RaceControlPanel } from "@/components/live/race-control-panel";

export type GapMode = "leader" | "interval";

export function LiveTiming() {
  useLiveTiming();
  const session = useLiveTimingStore((state) => state.session);
  const drivers = useLiveTimingStore((state) => state.drivers);
  const raceControl = useLiveTimingStore((state) => state.raceControl);
  const connection = useLiveTimingStore((state) => state.connection);
  const { today, currentEvent, nextAfterToday } = useCalendar();
  const [gapMode, setGapMode] = useState<GapMode>("leader");

  const hasData = connection === "live" && drivers.length > 0;
  // O feed da F1 guarda a última sessão entre um fim de semana e outro: só é "atual" se for a etapa do calendário.
  const isCurrentWeekend = hasData && feedMatchesEvent(session.meetingName, currentEvent);
  const weekendDone = isCurrentWeekend && session.sessionName.trim().toLowerCase() === "race" && isSessionOver(session);
  const showSessionHero = isCurrentWeekend && !weekendDone;
  const heroEvent = weekendDone ? nextAfterToday : currentEvent;
  const running = showSessionHero && isSessionRunning(session);
  const track = trackState(session);
  const showGapToggle = isRaceSession(session.sessionName);

  return <div className="live">
    {showSessionHero
      ? <SessionHero session={session} event={currentEvent} running={running} track={track} />
      : <EventHero event={heroEvent} today={today} />}

    <div className="live-body container">
      <section className="board" aria-labelledby="board-title">
        <header className="board-header">
          <div>
            <p className="eyebrow">{isCurrentWeekend ? (running ? "Classificação ao vivo" : "Classificação da sessão") : hasData ? "Último resultado" : "Classificação"}</p>
            <h2 id="board-title" className="board-title">
              {!hasData ? "Aguardando dados" : isCurrentWeekend ? sessionLabel(session.sessionName)
                : <>{session.meetingName}<span className="board-title-session"> · {sessionLabel(session.sessionName)}</span></>}
            </h2>
          </div>
          {hasData && showGapToggle && <div className="segmented" role="group" aria-label="Diferença exibida">
            <button type="button" aria-pressed={gapMode === "leader"} onClick={() => setGapMode("leader")}>Para o líder</button>
            <button type="button" aria-pressed={gapMode === "interval"} onClick={() => setGapMode("interval")}>Intervalo</button>
          </div>}
        </header>

        {hasData
          ? <TimingTable drivers={drivers} gapMode={showGapToggle ? gapMode : "leader"} isRace={showGapToggle} />
          : connection === "connecting"
            ? <TimingTableSkeleton />
            : <div className="empty-state">
              <p className="empty-title">Sem dados da F1 no momento</p>
              <p>O painel tenta de novo sozinho. Durante as sessões, a classificação aparece aqui em cerca de um segundo.</p>
            </div>}

        {hasData && <ul className="legend" aria-label="Legenda">
          <li><i className="swatch swatch-session-best" />Melhor da sessão</li>
          <li><i className="swatch swatch-personal-best" />Melhor pessoal</li>
          <li><i className="swatch swatch-normal" />Setor concluído</li>
        </ul>}
      </section>

      <RaceControlPanel messages={hasData ? raceControl : []} loading={connection === "connecting"} />
    </div>
  </div>;
}
