"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { SectionWorkspace } from "@/components/ui/section-workspace";
import { Countdown } from "@/components/ui/countdown";
import { F1_CALENDAR_SOURCES, formatWeekend } from "@/data/f1-calendar";
import { useCalendar } from "@/hooks/use-calendar";

function dateKey(date: Date) { return date.toISOString().slice(0, 10); }

export default function CalendarPage() {
  const { now, calendar, seasons } = useCalendar();
  const initialSeason = seasons.includes(now.getUTCFullYear()) ? now.getUTCFullYear() : 2026;
  const [season, setSeason] = useState<number>(initialSeason);
  const events = calendar[season] ?? [];
  const today = dateKey(now);
  const nextEvent = useMemo(() => events.find((event) => event.endDate >= today), [events, today]);
  const upcomingEvent = nextEvent;
  const target = upcomingEvent?.startDate ?? "";

  return <SectionWorkspace active="/calendar" title="Calendário" description="As etapas oficiais de 2026 e 2027; a próxima corrida acompanha a data atual.">
    <div className="calendar-page">
      {upcomingEvent && <section className="calendar-next-event">
        <div className="calendar-next-copy">
          <span className="widget-kicker">PRÓXIMO FIM DE SEMANA DE CORRIDA · ROUND {String(upcomingEvent.round).padStart(2,"0")}</span>
          <h2>{upcomingEvent.name}</h2>
          <div className="calendar-location"><MapPin size={14}/><span>{upcomingEvent.location}, {upcomingEvent.country}</span><i/> <span>{upcomingEvent.circuit}</span></div>
          <strong className="calendar-date-range">{formatWeekend(upcomingEvent)}</strong>
        </div>
        <div className="calendar-countdown">
          <span className="widget-kicker">{upcomingEvent.startDate > today ? "DIAS ATÉ O FIM DE SEMANA" : "FIM DE SEMANA EM ANDAMENTO"}</span>
          {target && <Countdown target={target} label={`o fim de semana do ${upcomingEvent.name}`} dateOnly />}
        </div>
      </section>}
      {!nextEvent && <div className="calendar-season-ended">Esta temporada terminou. Escolha 2027 para ver as próximas etapas.</div>}

      <div className="calendar-toolbar">
        <div><span className="widget-kicker">FIA FORMULA ONE WORLD CHAMPIONSHIP</span><h2>Temporadas</h2></div>
        <div className="calendar-season-tabs" aria-label="Selecionar temporada">
          {seasons.map((year) => <button key={year} type="button" aria-pressed={season === year} className={season === year ? "active" : ""} onClick={() => setSeason(year)}>{year}</button>)}
        </div>
      </div>

      <div className="calendar-round-list">
        {events.map((event) => {
          const completed = event.endDate < today;
          const isNext = event.round === nextEvent?.round;
          return <article className={`calendar-round ${isNext ? "is-next" : ""} ${completed ? "is-complete" : ""}`} key={`${event.season}-${event.round}`}>
            <span className="calendar-round-number">{String(event.round).padStart(2,"0")}</span>
            <div className="calendar-round-main"><span className="calendar-round-country">{event.country.toUpperCase()}</span><h3>{event.name}</h3><div className="calendar-location"><MapPin size={12}/><span>{event.location}</span><i/><span>{event.circuit}</span></div></div>
            <time dateTime={event.startDate}>{formatWeekend(event).replace(` ${event.season}`, "")}</time>
            <span className="calendar-round-status">{isNext ? "PRÓXIMA" : completed ? "ENCERRADA" : `ROUND ${String(event.round).padStart(2,"0")}`}</span>
          </article>;
        })}
      </div>

      <footer className="calendar-source"><div><CalendarDays size={15}/><span>Datas de fim de semana publicadas pela Formula 1. Horários de sessão podem ser atualizados pela organização.</span></div><a href={F1_CALENDAR_SOURCES[season]} target="_blank" rel="noreferrer">CALENDÁRIO OFICIAL {season}<ArrowUpRight size={13}/></a></footer>
    </div>
  </SectionWorkspace>;
}
