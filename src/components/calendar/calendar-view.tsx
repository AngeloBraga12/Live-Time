"use client";

import { useEffect, useRef, useState } from "react";
import { F1_SEASONS, type GrandPrixEvent } from "@/data/f1-calendar";
import { useCalendar } from "@/hooks/use-calendar";
import { countryName, daysUntil, weekendRange } from "@/lib/format";
import { CIRCUITS_META } from "@/data/circuits-meta";

type RaceState = "past" | "live" | "next" | "upcoming";

function RaceCard({ event, state, today, featured = false }: { event: GrandPrixEvent; state: RaceState; today: string | null; featured?: boolean }) {
  const days = today ? daysUntil(event.startDate, today) : null;
  const meta = CIRCUITS_META[event.circuit];
  return <li id={`race-${event.season}-${event.round}`} className={`race-card race-${state}${featured ? " race-featured" : ""}`} aria-current={featured ? "date" : undefined}>
    <div className="race-card-top">
      <span className="race-round">Etapa {event.round}</span>
      {state === "next" && <span className="race-flag">Próximo GP{days != null && days > 0 ? ` · ${days} ${days === 1 ? "dia" : "dias"}` : ""}</span>}
      {state === "live" && <span className="race-flag">Fim de semana atual</span>}
      {state === "past" && <span className="race-done">Encerrada</span>}
    </div>
    <p className="race-dates">{weekendRange(event)}</p>
    <h3 className="race-country">{countryName(event.country)}</h3>
    <p className="race-name">{event.name}</p>
    <p className="race-circuit">{event.circuit} · {event.location}</p>
    {meta && <img className="circuit-thumb" src={meta.mapPath} alt={meta.name} loading="lazy" />}
  </li>;
}

export function CalendarView() {
  const { today, events, currentEvent, nextAfterToday } = useCalendar();
  const defaultSeason = today ? Number(today.slice(0, 4)) : F1_SEASONS[0];
  const [chosenSeason, setChosenSeason] = useState<number | null>(null);
  const featuredEvent = currentEvent ?? nextAfterToday;
  const season = chosenSeason ?? featuredEvent?.season ?? (F1_SEASONS.includes(defaultSeason as (typeof F1_SEASONS)[number]) ? defaultSeason : F1_SEASONS[0]);
  const seasonEvents = events.filter((event) => event.season === season);
  const focusedOnOpen = useRef(false);

  useEffect(() => {
    if (!today || chosenSeason !== null || !featuredEvent || featuredEvent.season !== season || focusedOnOpen.current) return;
    const frame = requestAnimationFrame(() => {
      document.getElementById(`race-${featuredEvent.season}-${featuredEvent.round}`)?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "center",
      });
      focusedOnOpen.current = true;
    });
    return () => cancelAnimationFrame(frame);
  }, [today, chosenSeason, featuredEvent, season]);

  function stateOf(event: GrandPrixEvent): RaceState {
    if (!today) return "upcoming";
    if (event.endDate < today) return "past";
    if (event !== featuredEvent || event.season !== season) return "upcoming";
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
      {seasonEvents.map((event) => <RaceCard key={`${event.season}-${event.round}`} event={event} state={stateOf(event)} today={today} featured={today !== null && event === featuredEvent} />)}
    </ol>
  </div>;
}
