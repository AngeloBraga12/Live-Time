import type { DriverTiming } from "@/types/live-timing";
import { COMPOUND_LETTER, COMPOUND_NAME, lapTime, sectorTime } from "@/lib/format";
import type { GapMode } from "@/components/live/live-timing";

const SPECIAL_GAPS: Record<string, string> = { LEADER: "Líder", OUT: "Abandonou", KO: "Eliminado", STOP: "Parado" };

function Gap({ value }: { value: string }) {
  const special = SPECIAL_GAPS[value];
  return special ? <span className={value === "LEADER" ? "gap-leader" : "gap-out"}>{special}</span> : <>{value}</>;
}

function Tyre({ tire }: { tire: DriverTiming["tire"] }) {
  const label = `${COMPOUND_NAME[tire.compound]}${tire.condition === "new" ? ", novo" : ""}${tire.ageLaps != null ? `, ${tire.ageLaps} voltas` : ""}`;
  return <span className="tyre" title={label} aria-label={label}>
    <span className={`tyre-ring tyre-${tire.compound.toLowerCase()}`} aria-hidden="true">{COMPOUND_LETTER[tire.compound]}</span>
    <span className="tyre-age" aria-hidden="true">{tire.ageLaps ?? "—"}</span>
  </span>;
}

export function TimingTable({ drivers, gapMode, isRace }: { drivers: DriverTiming[]; gapMode: GapMode; isRace: boolean }) {
  return <div className="table-wrap timing-wrap">
    <table className="timing timing--live">
      <thead>
        <tr>
          <th scope="col" className="c-pos">Pos</th>
          <th scope="col" className="c-driver">Piloto</th>
          <th scope="col" className="c-gap">{isRace ? (gapMode === "leader" ? "Líder" : "Intervalo") : "Diferença"}</th>
          <th scope="col" className="c-lap">Última</th>
          <th scope="col" className="c-lap">Melhor</th>
          <th scope="col" className="c-sector">S1</th>
          <th scope="col" className="c-sector">S2</th>
          <th scope="col" className="c-sector">S3</th>
          <th scope="col" className="c-tyre">Pneu</th>
          <th scope="col" className="c-num">Voltas</th>
        </tr>
      </thead>
      <tbody>
        {drivers.map((driver) => {
          const inPit = driver.pitStatus === "in-pit" || driver.pitStatus === "pit-lane";
          return <tr key={driver.driverId} className={inPit ? "in-pit" : undefined}>
            <td className="c-pos">{driver.position ?? "—"}</td>
            <th scope="row" className="c-driver">
              <span className="driver">
                <span className="team-bar" style={{ background: driver.teamColour ?? "var(--ink-3)" }} aria-hidden="true" />
                <span className="driver-tla">{driver.abbreviation}</span>
                <span className="driver-name">{driver.fullName}<span className="driver-team">{driver.teamName}</span></span>
                {inPit && <span className="pit-tag">{driver.pitStatus === "in-pit" ? "Box" : "Pit lane"}</span>}
              </span>
            </th>
            <td className="c-gap" data-label={isRace ? (gapMode === "interval" ? "Intervalo" : "Líder") : "Diferença"}><Gap value={isRace && gapMode === "interval" && driver.gapToLeader !== "LEADER" && !SPECIAL_GAPS[driver.gapToLeader] ? driver.interval : driver.gapToLeader} /></td>
            <td className="c-lap c-lap-first" data-label="Últ">{lapTime(driver.lastLapSeconds)}</td>
            <td className="c-lap c-lap-best" data-label="Mel">{lapTime(driver.bestLapSeconds)}</td>
            {driver.sectors.map((sector) => <td key={sector.sector} className="c-sector" data-label={`S${sector.sector}`}><span className={`sector sector-${sector.status}`}>{sectorTime(sector.timeSeconds)}</span></td>)}
            <td className="c-tyre" data-label="Pneu"><Tyre tire={driver.tire} /></td>
            <td className="c-num" data-label="Voltas">{driver.completedLaps}</td>
          </tr>;
        })}
      </tbody>
    </table>
  </div>;
}

export function TimingTableSkeleton() {
  return <div className="table-wrap" aria-busy="true" aria-label="Carregando classificação">
    <div className="skeleton-rows">{Array.from({ length: 10 }, (_, index) => <div key={index} className="skeleton skeleton-row" />)}</div>
  </div>;
}
