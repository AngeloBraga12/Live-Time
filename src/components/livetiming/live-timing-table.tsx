import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUp, CircleDot, Minus, Radio } from "lucide-react";
import type { DriverTiming, SectorStatus, SessionStatus, TireCompound } from "@/types/live-timing";

const compoundLabel: Record<TireCompound, string> = { UNKNOWN: "—", SOFT: "S", MEDIUM: "M", HARD: "H", INTERMEDIATE: "I", WET: "W" };
const compoundName: Record<TireCompound, string> = { UNKNOWN: "Desconhecido", SOFT: "Soft", MEDIUM: "Medium", HARD: "Hard", INTERMEDIATE: "Intermediate", WET: "Wet" };

function lapTime(seconds: number | null) {
  if (seconds == null || !Number.isFinite(seconds)) return "—:—.———";
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${(seconds - minutes * 60).toFixed(3).padStart(6, "0")}`;
}

function Sector({ time, status }: { time: number | null; status: SectorStatus }) {
  return <span className={`sector-time sector-${status}`}>{time == null ? "—.———" : time.toFixed(3)}</span>;
}

function PositionChange({ driver }: { driver: DriverTiming }) {
  if (driver.position == null || driver.previousPosition == null || driver.previousPosition === driver.position) return <Minus size={12} className="position-same"/>;
  return driver.previousPosition > driver.position ? <ArrowUp size={13} className="position-up"/> : <ArrowDown size={13} className="position-down"/>;
}

export function LiveTimingTable({ drivers, currentLap, selectedDriver, onSelect, sessionStatus, eventDescription }: { drivers: DriverTiming[]; currentLap: number; selectedDriver: string; onSelect: (driverId: string) => void; sessionStatus: SessionStatus; eventDescription: string }) {
  return <section className={`timing-panel ${drivers.length === 0 ? "timing-panel-empty" : ""}`}>
    <div className="timing-panel-top"><div className="table-title"><span className="widget-kicker">CLASSIFICAÇÃO</span><h2>Live Timing <span>· Volta {currentLap || "—"}</span></h2></div><div className="table-live"><span/> {sessionStatus === "finished" || sessionStatus === "chequered" ? "SESSÃO ENCERRADA" : sessionStatus === "scheduled" ? "SESSÃO AGENDADA" : "F1 LIVE · FEED EM TEMPO REAL"}</div></div>
    <div className="table-scroll">{drivers.length === 0 ? <div className="empty-timing"><div className="empty-timing-state"><CircleDot size={24}/><span className="empty-kicker">DADOS DE SESSÃO</span><strong>Timing ainda indisponível</strong><p>{eventDescription}</p><Link href="/settings">VER ESTADO DA API <ArrowRight size={13}/></Link></div></div> : <table className="timing-table">
      <thead><tr><th className="col-pos">POS</th><th className="col-driver">PILOTO</th><th className="col-gap">GAP</th><th className="col-gap">INTERVALO</th><th className="col-lap">ÚLTIMA</th><th className="col-lap">MELHOR</th><th className="col-sector">S1</th><th className="col-sector">S2</th><th className="col-sector">S3</th><th className="col-tire">PNEU</th><th className="col-laps">VOL</th></tr></thead>
      <tbody>{drivers.map((driver) => <tr key={driver.driverId} onClick={() => onSelect(driver.driverId)} className={selectedDriver === driver.driverId ? "driver-selected" : ""}>
        <td><div className="position-cell"><b>{driver.position == null ? "—" : String(driver.position).padStart(2, "0")}</b><PositionChange driver={driver}/></div></td>
        <td><div className="driver-cell"><span className={`team-stripe team-${driver.team}`}/><span className="driver-name"><strong>{driver.abbreviation}</strong><small>{driver.fullName}</small></span>{driver.pitStatus !== "track" && driver.pitStatus !== "unknown" && <span className="pit-tag">PIT</span>}</div></td>
        <td className="mono gap-cell">{driver.gapToLeader === "LEADER" ? <span className="leader-label">LEADER</span> : driver.gapToLeader}</td><td className="mono gap-cell">{driver.interval}</td>
        <td className="mono lap-cell">{lapTime(driver.lastLapSeconds)}</td><td className="mono lap-cell">{lapTime(driver.bestLapSeconds)}{driver.bestLapSeconds != null && driver.lastLapSeconds === driver.bestLapSeconds && <span className="best-dot"/>}</td>
        {driver.sectors.map((sector) => <td key={sector.sector}><Sector time={sector.timeSeconds} status={sector.status}/></td>)}
        <td><span className={`tire-compound tire-${driver.tire.compound.toLowerCase()}`} title={`${compoundName[driver.tire.compound]} · ${driver.tire.ageLaps ?? "idade desconhecida"} voltas`}><b>{compoundLabel[driver.tire.compound]}</b><small>{driver.tire.ageLaps ?? "—"}</small></span></td>
        <td className="mono laps-cell">{driver.completedLaps}<Radio size={11} className="radio-mark"/></td>
      </tr>)}</tbody>
    </table>}</div>
    <div className="table-footer"><span><i className="legend-dot legend-purple"/> MELHOR SETOR DA SESSÃO</span><span><i className="legend-dot legend-green"/> MELHOR PESSOAL</span><span className="table-footer-right">Clique em um piloto para ver telemetria</span></div>
  </section>;
}
