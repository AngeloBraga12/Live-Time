"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { type GrandPrixEvent } from "@/data/f1-calendar";
import { weekendRange } from "@/lib/format";

type Session = { label: string; date: string; time?: string; timeZone?: string };
type PodiumEntry = { position: number; driver: string; code: string; team: string };
type GrandPrixDetailData = {
  sprintWeekend: boolean;
  sessions: Session[];
  raceStart: { date: string; time: string } | null;
  racePodium: PodiumEntry[];
  sprintPodium: PodiumEntry[];
  raceResultsAvailable: boolean;
  sprintResultsAvailable: boolean;
  scheduleSource: string | null;
  resultsSource: string | null;
  sources: { official: string; data: string };
};

const dateLabel = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long", timeZone: "UTC" });
const timeZone = "America/Sao_Paulo";
const countdownUnits = [
  { key: "days", label: "dias" },
  { key: "hours", label: "horas" },
  { key: "minutes", label: "min" },
  { key: "seconds", label: "seg" },
] as const;

function localDateKey(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatSession(session: Session, timeZone: string) {
  if (session.time) {
    const instant = new Date(`${session.date}T${session.time}`);
    return new Intl.DateTimeFormat("pt-BR", {
      weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZoneName: "short", timeZone,
    }).format(instant);
  }
  return dateLabel.format(new Date(`${session.date}T12:00:00Z`));
}

function Countdown({ event, raceStart }: { event: GrandPrixEvent; raceStart: GrandPrixDetailData["raceStart"] }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (now === null) return <div className="gp-countdown gp-countdown-loading" aria-label="Carregando contagem regressiva" />;

  const today = localDateKey(now);
  if (event.endDate < today) return <div className="gp-countdown-ended">Etapa encerrada</div>;

  const exactStart = raceStart ? new Date(`${raceStart.date}T${raceStart.time}`).getTime() : null;
  const dateStart = new Date(`${event.raceDate}T00:00:00`).getTime();
  const target = exactStart ?? dateStart;
  const remaining = Math.max(0, target - now);

  if (!exactStart && event.raceDate <= today) {
    return <div className="gp-countdown-today">Grande Prêmio hoje <span>Horário da largada ainda não publicado</span></div>;
  }
  if (exactStart && remaining === 0 && event.endDate >= today) {
    return <div className="gp-countdown-today">A largada já aconteceu <span>Confira o resultado nesta página.</span></div>;
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const values = {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };

  return <div className="gp-countdown">
    <p className="gp-countdown-caption">{exactStart ? "Tempo até a largada" : "Até o dia da corrida"}</p>
    <div className="gp-countdown-grid" aria-live="off">
      {countdownUnits.map(({ key, label }) => <div className="gp-countdown-unit" key={key}>
        <strong>{String(values[key]).padStart(2, "0")}</strong><span>{label}</span>
      </div>)}
    </div>
  </div>;
}

function Podium({ title, entries, unavailable, loading }: { title: string; entries: PodiumEntry[]; unavailable: boolean; loading: boolean }) {
  return <section className="gp-panel" aria-label={title}>
    <h2 className="section-title">{title}</h2>
    {entries.length > 0 ? <ol className="gp-podium">
      {entries.map((entry) => <li key={entry.position} className="gp-podium-place">
        <span className="gp-podium-position">{entry.position}º</span>
        <strong>{entry.driver}</strong>
        <span>{entry.team}</span>
      </li>)}
    </ol> : <p className="gp-data-gap">{loading ? "Carregando resultado…" : unavailable ? "Resultado ainda indisponível na fonte consultada." : "Pódio não divulgado."}</p>}
  </section>;
}

export function GrandPrixDetail({ event }: { event: GrandPrixEvent }) {
  const [detail, setDetail] = useState<GrandPrixDetailData | null>(null);
  const [today, setToday] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const updateToday = () => setToday(localDateKey(Date.now()));
    const initialUpdate = window.setTimeout(updateToday, 0);
    const dateInterval = window.setInterval(updateToday, 60_000);
    const controller = new AbortController();
    fetch(`/api/calendar/${event.season}/${event.round}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Falha ao buscar a programação");
        return response.json() as Promise<GrandPrixDetailData>;
      })
      .then((data) => setDetail(data))
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setLoadError(true);
      });
    return () => {
      window.clearTimeout(initialUpdate);
      window.clearInterval(dateInterval);
      controller.abort();
    };
  }, [event.season, event.round]);

  const eventHasEnded = today !== null && event.endDate < today;
  const sprintWeekend = detail?.sprintWeekend ?? false;
  const sessions = detail?.sessions ?? [];
  const racePodium = detail?.racePodium ?? [];
  const sprintPodium = detail?.sprintPodium ?? [];
  const calendarHref = "/calendar";
  const raceResultsUnavailable = loadError || !detail?.raceResultsAvailable;
  const sprintResultsUnavailable = loadError || !detail?.sprintResultsAvailable;
  const hasExactSchedule = sessions.some((session) => session.time);

  return <div className="container gp-detail-page">
    <Link className="gp-back-link" href={calendarHref}>← Calendário {event.season}</Link>
    <header className="gp-detail-header">
      <p className="eyebrow">Etapa {event.round} · {event.season}</p>
      <h1 className="page-title">{event.name}</h1>
      <p className="gp-detail-subtitle">{event.name} · {event.circuit} · {event.location}</p>
      <p className="gp-detail-dates">{weekendRange(event)}</p>
    </header>

    <section className="gp-countdown-panel" aria-label="Contagem regressiva">
      <Countdown event={event} raceStart={detail?.raceStart ?? null} />
    </section>

    <section className="gp-panel gp-schedule-panel">
      <div className="gp-section-heading">
        <div><p className="eyebrow">Fim de semana</p><h2 className="section-title">Programação</h2></div>
        {sprintWeekend && <span className="gp-sprint-badge">Fim de semana Sprint</span>}
      </div>
      {sessions.length > 0 ? <ol className="gp-session-list">
        {sessions.map((session) => <li className="gp-session-row" key={`${session.label}-${session.date}`}>
          <strong>{session.label}</strong>
          <span>{formatSession(session, timeZone)}</span>
          {!session.time && <small>Horário ainda não publicado</small>}
        </li>)}
      </ol> : <p className="gp-data-gap">{loadError ? "Não foi possível carregar os horários agora." : "Carregando a programação…"}</p>}
      <p className="gp-timezone-note">Horários em Brasília (BRT).</p>
      {event.season === 2027 && !hasExactSchedule && <p className="gp-data-gap">Os horários das sessões ainda não foram publicados. As datas dos dias seguem o calendário oficial.</p>}
    </section>

    {(eventHasEnded || racePodium.length > 0) && <Podium title="Pódio da corrida" entries={racePodium} unavailable={raceResultsUnavailable} loading={!detail && !loadError} />}
    {sprintWeekend && (eventHasEnded || sprintPodium.length > 0) && <Podium title="Pódio da Sprint" entries={sprintPodium} unavailable={sprintResultsUnavailable} loading={!detail && !loadError} />}

    <footer className="gp-sources">
      <span>Fontes:</span>
      <a href={detail?.sources.official ?? event.url} target="_blank" rel="noreferrer">Calendário oficial da Fórmula 1</a>
      <a href={detail?.sources.data ?? "https://api.jolpi.ca/ergast/f1/"} target="_blank" rel="noreferrer">Programação e resultados · Jolpica/Ergast</a>
    </footer>
  </div>;
}
