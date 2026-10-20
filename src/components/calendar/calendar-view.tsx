"use client";

import { useState } from "react";
import { F1_SEASONS, type GrandPrixEvent } from "@/data/f1-calendar";
import { useCalendar } from "@/hooks/use-calendar";
import { countryName, daysUntil, weekendRange } from "@/lib/format";

type RaceState = "past" | "live" | "next" | "upcoming";

function RaceCard({ event, state, today }: { event: GrandPrixEvent; state: RaceState; today: string | null }) {
  const days = today ? daysUntil(event.startDate, today) : null;
  return <li className={`race-card race-${state}`}>
    <div className="race-card-top">
      <span className="race-round">Etapa {event.round}</span>
      {state === "next" && <span className="race-flag">Próxima{days != null && days > 0 ? ` · ${days} ${days === 1 ? "dia" : "dias"}` : ""}</span>}
      {state === "live" && <span className="race-flag">Neste fim de semana</span>}
      {state === "past" && <span className="race-done">Encerrada</span>}
    </div>
    <p className="race-dates">{weekendRange(event)}</p>
    <h3 className="race-country">{countryName(event.country)}</h3>
    <p className="race-name">{event.name}</p>
    <p className="race-circuit">{event.circuit} · {event.location}</p>
  </li>;
}

export function CalendarView() {
  const { today, events } = useCalendar();
  const defaultSeason = today ? Number(today.slice(0, 4)) : F1_SEASONS[0];
  const [chosenSeason, setChosenSeason] = useState<number | null>(null);
  const season = chosenSeason ?? (F1_SEASONS.includes(defaultSeason as (typeof F1_SEASONS)[number]) ? defaultSeason : F1_SEASONS[0]);
  const seasonEvents = events.filter((event) => event.season === season);
  // A primeira etapa que ainda não terminou é destacada: "live" se já começou, "next" se não.
  const highlighted = today ? events.find((event) => event.endDate >= today) : undefined;

  function stateOf(event: GrandPrixEvent): RaceState {
    if (!today) return "upcoming";
    if (event.endDate < today) return "past";
    if (event !== highlighted) return "upcoming";
    return event.startDate <= today ? "live" : "next";
  }

  return <div className="container calendar">
    <header className="page-header">
      <div>
        <p className="eyebrow">Campeonato Mundial de Fórmula 1</p>
        <h1 className="page-title">Calendário {season}</h1>
      </div>
      <div className="segmented" role="group" aria-label="Temporada">
        {F1_SEASONS.map((year) => <button key={year} type="button" aria-pressed={year === season} onClick={() => setChosenSeason(year)}>{year}</button>)}
      </div>
    </header>
    <ol className="race-grid">
      {seasonEvents.map((event) => <RaceCard key={`${event.season}-${event.round}`} event={event} state={stateOf(event)} today={today} />)}
    </ol>
  </div>;
}
