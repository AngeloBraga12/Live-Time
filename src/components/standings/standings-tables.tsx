import Link from "next/link";
import type { DriverStanding, ConstructorStanding } from "@/types/championship";

function DriverRow({ d, previous }: { d: DriverStanding; previous?: DriverStanding | null }) {
  const prevPos = previous?.position ?? null;
  const delta = prevPos ? d.position - prevPos : null;
  return (
    <tr>
      <td className="c-pos">{d.position}{delta !== null && delta !== 0 && <span className={`delta ${delta > 0 ? "up" : "down"}`}>{delta > 0 ? `+${delta}` : delta}</span>}</td>
      <td>
        <Link href={`/driver/${d.driverId}`} className="driver">
          <span className="driver-tla">{d.driverId.toUpperCase()}</span>
          <span className="driver-name">{d.driverName}</span>
        </Link>
      </td>
      <td className="hide-sm">{d.permanentNumber ?? "—"}</td>
      <td className="hide-sm">
        <Link href={`/team/${d.teamId}`} className="text-link">{d.team}</Link>
      </td>
      <td className="c-points">{d.points}</td>
      <td className="hide-md">{d.wins}</td>
    </tr>
  );
}

function ConstructorRow({ c, previous }: { c: ConstructorStanding; previous?: ConstructorStanding | null }) {
  const prevPos = previous?.position ?? null;
  const delta = prevPos ? c.position - prevPos : null;
  return (
    <tr>
      <td className="c-pos">{c.position}{delta !== null && delta !== 0 && <span className={`delta ${delta > 0 ? "up" : "down"}`}>{delta > 0 ? `+${delta}` : delta}</span>}</td>
      <td>
        <Link href={`/team/${c.constructorId}`} className="driver">
          <span className="driver-tla">{c.constructorId.toUpperCase()}</span>
          <span className="driver-name">{c.constructorName}</span>
        </Link>
      </td>
      <td className="c-points">{c.points}</td>
      <td className="hide-md">{c.wins}</td>
    </tr>
  );
}

export function StandingsTables({ drivers, constructors, previous }: { drivers: DriverStanding[]; constructors: ConstructorStanding[]; previous?: { drivers: DriverStanding[]; constructors: ConstructorStanding[] } | null }) {
  return (
    <div className="standings">
      <section className="board" aria-labelledby="drivers-title">
        <header className="board-header">
          <h2 id="drivers-title" className="board-title">Campeonato de Pilotos</h2>
        </header>
        <div className="table-wrap">
          <table className="timing">
            <thead>
              <tr>
                <th className="c-pos">Pos</th>
                <th>Piloto</th>
                <th className="hide-sm">Nº</th>
                <th className="hide-sm">Equipe</th>
                <th className="c-points">Pontos</th>
                <th className="hide-md">Vitórias</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map(d => {
                const prev = previous?.drivers.find(p => p.driverId === d.driverId) ?? null;
                return <DriverRow key={d.driverId} d={d} previous={prev} />;
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="board" aria-labelledby="constructors-title">
        <header className="board-header">
          <h2 id="constructors-title" className="board-title">Campeonato de Construtores</h2>
        </header>
        <div className="table-wrap">
          <table className="timing">
            <thead>
              <tr>
                <th className="c-pos">Pos</th>
                <th>Equipe</th>
                <th className="c-points">Pontos</th>
                <th className="hide-md">Vitórias</th>
              </tr>
            </thead>
            <tbody>
              {constructors.map(c => {
                const prev = previous?.constructors.find(p => p.constructorId === c.constructorId) ?? null;
                return <ConstructorRow key={c.constructorId} c={c} previous={prev} />;
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
