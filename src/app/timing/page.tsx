"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Gauge, RadioTower } from "lucide-react";
import { SectionWorkspace } from "@/components/ui/section-workspace";
import { StatusPill } from "@/components/ui/status-pill";
import { LiveTimingTable } from "@/components/livetiming/live-timing-table";
import { RaceControlTicker } from "@/components/livetiming/race-control-ticker";
import { useLiveTimingStore } from "@/store/live-timing-store";
import type { DriverTiming } from "@/types/live-timing";
import { formatWeekend } from "@/data/f1-calendar";
import { useCalendar } from "@/hooks/use-calendar";

type TimingView = "leaderboard" | "sectors" | "tyres" | "race-control";
const views: { id: TimingView; label: string }[] = [
  { id: "leaderboard", label: "Classificação" }, { id: "sectors", label: "Setores" }, { id: "tyres", label: "Pneus" }, { id: "race-control", label: "Race Control" },
];
const tyreSymbols: Record<DriverTiming["tire"]["compound"], string> = { UNKNOWN: "—", SOFT: "S", MEDIUM: "M", HARD: "H", INTERMEDIATE: "I", WET: "W" };

function SectorTable({ drivers }: { drivers: DriverTiming[] }) {
  return <section className="timing-panel data-view-panel"><div className="timing-panel-top"><div className="table-title"><span className="widget-kicker">RITMO DE VOLTA</span><h2>Setores por piloto</h2></div></div><div className="table-scroll"><table className="timing-table sector-view-table"><thead><tr><th>POS</th><th>PILOTO</th><th>S1</th><th>S2</th><th>S3</th><th>MELHOR VOLTA</th></tr></thead><tbody>{drivers.map((driver) => <tr key={driver.driverId}><td className="mono">{driver.position == null ? "—" : String(driver.position).padStart(2, "0")}</td><td><DriverCell driver={driver}/></td>{driver.sectors.map((sector) => <td key={sector.sector}><span className={`sector-time sector-${sector.status}`}>{sector.timeSeconds == null ? "—.———" : sector.timeSeconds.toFixed(3)}</span></td>)}<td className="mono">{driver.bestLapSeconds == null ? "—:—.———" : `${Math.floor(driver.bestLapSeconds / 60)}:${(driver.bestLapSeconds % 60).toFixed(3).padStart(6, "0")}`}</td></tr>)}</tbody></table>{drivers.length === 0 && <EmptyTiming/>}</div></section>;
}

function TyreTable({ drivers }: { drivers: DriverTiming[] }) {
  return <section className="timing-panel data-view-panel"><div className="timing-panel-top"><div className="table-title"><span className="widget-kicker">ESTRATÉGIA DE PNEUS</span><h2>Composto e stint atual</h2></div></div><div className="table-scroll"><table className="timing-table tyre-view-table"><thead><tr><th>POS</th><th>PILOTO</th><th>COMPOSTO</th><th>IDADE</th><th>VOLTAS</th><th>SITUAÇÃO</th></tr></thead><tbody>{drivers.map((driver) => <tr key={driver.driverId}><td className="mono">{driver.position == null ? "—" : String(driver.position).padStart(2, "0")}</td><td><DriverCell driver={driver}/></td><td><span className={`tire-compound tire-${driver.tire.compound.toLowerCase()}`}><b>{tyreSymbols[driver.tire.compound]}</b><strong>{driver.tire.compound === "UNKNOWN" ? "Não informado" : driver.tire.compound}</strong></span></td><td className="mono">{driver.tire.ageLaps == null ? "—" : `${driver.tire.ageLaps} VOL`}</td><td className="mono">{driver.completedLaps}</td><td><span className={`pit-state ${driver.pitStatus}`}>{driver.pitStatus === "in-pit" ? "BOX" : driver.pitStatus === "pit-lane" ? "PIT LANE" : driver.pitStatus === "track" ? "NA PISTA" : "—"}</span></td></tr>)}</tbody></table>{drivers.length === 0 && <EmptyTiming/>}</div></section>;
}

function DriverCell({ driver }: { driver: DriverTiming }) {
  return <div className="driver-cell"><span className={`team-stripe team-${driver.team}`} style={driver.teamColour ? { backgroundColor: driver.teamColour } : undefined}/><span className="driver-name"><strong>{driver.abbreviation}</strong><small>{driver.fullName}</small></span></div>;
}

function EmptyTiming() {
  return <div className="timing-empty-inline"><RadioTower size={18}/><span>Aguardando dados da sessão</span></div>;
}

export default function LiveTimingPage() {
  const session = useLiveTimingStore((state) => state.session);
  const drivers = useLiveTimingStore((state) => state.drivers);
  const raceControl = useLiveTimingStore((state) => state.raceControl);
  const connection = useLiveTimingStore((state) => state.connection);
  const { currentEvent, nextAfterToday } = useCalendar();
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [activeView, setActiveView] = useState<TimingView>("leaderboard");
  const selectedDriver = useMemo(() => drivers.find((driver) => driver.driverId === selectedDriverId) ?? drivers[0], [drivers, selectedDriverId]);
  const liveMeeting = session.meetingName.trim();
  const normalizedMeeting = liveMeeting.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const eventAliases = currentEvent ? [currentEvent.name, currentEvent.location, currentEvent.country].map((value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()) : [];
  const feedMatchesCurrentEvent = Boolean(currentEvent && eventAliases.some((alias) => alias.length > 3 && normalizedMeeting.includes(alias)));
  const feedFinishedCurrentEvent = connection === "live" && feedMatchesCurrentEvent && (session.status === "finished" || session.status === "chequered");
  const displayCalendarEvent = feedFinishedCurrentEvent ? nextAfterToday ?? currentEvent : currentEvent;
  const showFeedSession = connection === "live" && feedMatchesCurrentEvent && liveMeeting && session.status !== "finished" && session.status !== "chequered";
  const displayedDrivers = showFeedSession ? drivers : [];
  const displayedRaceControl = showFeedSession ? raceControl : [];
  const displayedDriver = showFeedSession ? selectedDriver : undefined;
  const eventName = showFeedSession ? session.meetingName : displayCalendarEvent?.name ?? "Calendário indisponível";
  const eventCircuit = showFeedSession && session.circuitName ? session.circuitName : displayCalendarEvent?.circuit ?? "";
  const eventLocation = showFeedSession && session.locality ? session.locality : displayCalendarEvent?.location ?? "";
  const eventCountry = showFeedSession && session.country ? session.country : displayCalendarEvent?.country ?? "";
  const eventDescription = showFeedSession
    ? `Aguardando dados publicados da sessão ${session.sessionName} em ${eventName}.`
    : displayCalendarEvent
      ? `Aguardando a conexão da f1-livetiming-api. A próxima etapa é ${eventName}, no fim de semana de ${formatWeekend(displayCalendarEvent)}.`
      : "Aguardando conexão da f1-livetiming-api e a próxima etapa publicada no calendário.";

  return <SectionWorkspace active="/timing" title="Live Timing" description="Acompanhe posições, ritmo, pneus e mensagens da sessão ao vivo."><div className="live-timing-page f1-timing-shell">
    <header className="event-header"><div className="event-title-block"><div className="event-title-row"><span className="country-mark">F1</span><div><div className="event-overline">{showFeedSession ? "F1 LIVE" : `ROUND ${String(displayCalendarEvent?.round ?? "—").padStart(2,"0")} · CALENDÁRIO ${displayCalendarEvent?.season ?? ""}`} <span>·</span> {showFeedSession ? session.sessionName : "PRÓXIMO GP"}</div><h1>{eventName}</h1></div></div><div className="event-subtitle">{eventCircuit}<span>·</span>{eventLocation}{eventCountry && eventCountry !== eventLocation ? <><span>·</span>{eventCountry}</> : null}<span>·</span>{displayCalendarEvent ? formatWeekend(displayCalendarEvent) : ""}</div></div><div className="event-header-right"><div className="session-chip"><span className="session-chip-dot"/><span>{showFeedSession ? session.sessionName : displayCalendarEvent?.name ?? "F1 CALENDAR"}</span><ChevronDown size={13}/></div><StatusPill flag={showFeedSession ? session.trackFlag : "unknown"}/></div></header>
    <section className="session-ribbon" aria-label="Resumo da sessão"><div className="session-stat"><span className="stat-label">VOLTA</span><strong>{String(showFeedSession ? session.currentLap : 0).padStart(2, "0")}<small> / {showFeedSession ? session.totalLaps || "—" : "—"}</small></strong><div className="lap-progress"><i style={{ width: `${showFeedSession && session.totalLaps ? Math.min(100, session.currentLap / session.totalLaps * 100) : 0}%` }}/></div></div><div className="ribbon-separator"/><div className="session-stat"><span className="stat-label">LÍDER</span><strong className="leader-stat">{displayedDrivers[0]?.abbreviation ?? "—"}</strong><small className="stat-detail">{displayedDrivers[0]?.gapToLeader === "LEADER" ? "P1" : displayedDrivers[0]?.lastLapSeconds?.toFixed(3) ?? "—"}</small></div><div className="ribbon-separator"/><div className="session-stat"><span className="stat-label">TEMPERATURA</span><strong>{showFeedSession ? session.trackTemperatureC ?? "—" : "—"}<small>°C</small></strong><small className="stat-detail">PISTA</small></div><div className="ribbon-separator"/><div className={`session-stat flag-stat track-${showFeedSession ? session.trackFlag : "unknown"}`}><span className="stat-label">BANDEIRA</span><strong><i/> {showFeedSession ? session.trackFlag.toUpperCase() : "UNKNOWN"}</strong><small className="stat-detail">{showFeedSession ? session.status.toUpperCase().replaceAll("-", " ") : "SCHEDULED"}</small></div><div className="session-ribbon-spacer"/><div className={`updated-at ${showFeedSession ? "is-live" : ""}`}><span className="pulse-ring"/>{showFeedSession ? "LIVE" : connection === "connecting" ? "CONECTANDO" : "SEM SINAL"}<b>{showFeedSession ? "1s" : "—"}</b></div></section>
    <nav className="timing-view-tabs" aria-label="Visualizações do Live Timing" role="tablist">{views.map((view) => <button key={view.id} type="button" role="tab" aria-selected={activeView === view.id} className={activeView === view.id ? "active" : ""} onClick={() => setActiveView(view.id)}>{view.label}{view.id === "race-control" && displayedRaceControl.length > 0 && <span>{displayedRaceControl.length}</span>}</button>)}</nav>
    <div className="content-grid f1-timing-content"><div className="primary-column">{activeView === "leaderboard" && <LiveTimingTable drivers={displayedDrivers} currentLap={showFeedSession ? session.currentLap : 0} sessionStatus={showFeedSession ? session.status : "scheduled"} selectedDriver={displayedDriver?.driverId ?? ""} onSelect={setSelectedDriverId} eventDescription={eventDescription}/>}{activeView === "sectors" && <SectorTable drivers={displayedDrivers}/>}{activeView === "tyres" && <TyreTable drivers={displayedDrivers}/>}{activeView === "race-control" && <RaceControlTicker messages={displayedRaceControl}/>}</div><aside className="insight-column f1-timing-aside"><section className="telemetry-card driver-focus-card"><header className="widget-header"><div><span className="widget-kicker">PILOTO SELECIONADO</span><h2><span className={`team-stripe team-${displayedDriver?.team ?? "unknown"}`} style={displayedDriver?.teamColour ? { backgroundColor: displayedDriver.teamColour } : undefined}/>{displayedDriver?.fullName ?? "Selecione um piloto"}</h2></div><Gauge size={15}/></header><div className="driver-focus-number">{displayedDriver?.abbreviation ?? "—"}<span>CAR {displayedDriver?.carNumber ?? "—"}</span></div><div className="telemetry-reading"><div><span>ÚLTIMA VOLTA</span><strong>{displayedDriver?.lastLapSeconds?.toFixed(3) ?? "—"}<small> s</small></strong></div><div><span>MELHOR</span><strong>{displayedDriver?.bestLapSeconds?.toFixed(3) ?? "—"}<small> s</small></strong></div><div><span>VELOCIDADE</span><strong>{displayedDriver?.telemetry?.speedKph ?? "—"}<small> km/h</small></strong></div></div><div className="driver-focus-footer"><span>{displayedDriver?.tire.compound ?? "PNEU —"} {displayedDriver?.tire.ageLaps == null ? "" : `· ${displayedDriver.tire.ageLaps} VOLTAS`}</span><span>{displayedDriver?.gapToLeader ?? "—"}</span></div></section>{activeView !== "race-control" && <RaceControlTicker messages={displayedRaceControl}/>}</aside></div>
  </div></SectionWorkspace>;
}
