import Link from "next/link";
import type { GrandPrixEvent } from "@/data/f1-calendar";
import type { SessionInfo } from "@/types/live-timing";
import { daysUntil, sessionLabel, weekendRange, type TrackState } from "@/lib/format";

function Stat({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return <div className="hero-stat">
    <dt>{label}</dt>
    <dd>{value}{unit && <span className="hero-stat-unit">{unit}</span>}</dd>
  </div>;
}

/** Cabeçalho durante o fim de semana: sessão do feed, voltas, clima e estado da pista. */
export function SessionHero({ session, event, running, track }: { session: SessionInfo; event?: GrandPrixEvent; running: boolean; track: { state: TrackState; label: string } }) {
  const temperature = (value: number | null) => (value == null ? "—" : Math.round(value));
  return <section className="hero hero-session" aria-labelledby="hero-title">
    <div className="container hero-grid">
      <div>
        <p className="hero-kicker">
          {running && <span className="live-badge">Ao vivo</span>}
          {event && <span>Etapa {event.round}</span>}
          <span>{session.circuitName || event?.circuit}</span>
        </p>
        <h1 id="hero-title" className="hero-title">{session.meetingName}</h1>
        <p className="hero-sub">{sessionLabel(session.sessionName)}</p>
      </div>
      <dl className="hero-stats">
        {session.totalLaps > 0 && <Stat label="Volta" value={`${session.currentLap}/${session.totalLaps}`} />}
        <Stat label="Ar" value={temperature(session.airTemperatureC)} unit="°C" />
        <Stat label="Pista" value={temperature(session.trackTemperatureC)} unit="°C" />
      </dl>
    </div>
    <div className={`track-strip track-${track.state}`} role="status"><div className="container">{track.label}</div></div>
  </section>;
}

/** Cabeçalho fora das sessões: etapa atual ou próxima, com contagem regressiva. */
export function EventHero({ event, today }: { event?: GrandPrixEvent; today: string | null }) {
  if (!today) return <section className="hero hero-event" aria-busy="true"><div className="container hero-grid"><div><p className="hero-kicker"><span className="skeleton skeleton-text" /></p><div className="skeleton skeleton-title" /></div></div></section>;
  if (!event) return <section className="hero hero-event"><div className="container"><h1 className="hero-title">Temporada encerrada</h1></div></section>;
  const inProgress = today >= event.startDate && today <= event.endDate;
  const days = daysUntil(event.startDate, today);
  return <section className="hero hero-event" aria-labelledby="hero-title">
    <div className="container hero-grid">
      <div>
        <p className="hero-kicker">
          <span className="next-badge">{inProgress ? "Fim de semana em andamento" : "Próxima etapa"}</span>
          <span>Etapa {event.round} · {event.season}</span>
        </p>
        <h1 id="hero-title" className="hero-title">{event.name}</h1>
        <p className="hero-sub">{event.circuit} · {event.location}</p>
        <p className="hero-dates">{weekendRange(event)}</p>
      </div>
      <div className="countdown" aria-label={inProgress ? "Fim de semana em andamento" : `Faltam ${days} dias`}>
        {inProgress
          ? <span className="countdown-now">Sessões a qualquer momento</span>
          : <><span className="countdown-value">{String(days).padStart(2, "0")}</span><span className="countdown-unit">{days === 1 ? "dia" : "dias"}</span></>}
        <Link href="/calendar" className="text-link">Ver calendário</Link>
      </div>
    </div>
  </section>;
}
