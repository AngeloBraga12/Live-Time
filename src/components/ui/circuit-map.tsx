import { CIRCUITS_META } from "@/data/circuits-meta";
import type { GrandPrixEvent } from "@/data/f1-calendar";

export function CircuitMap({ event }: { event: GrandPrixEvent }) {
  const meta = CIRCUITS_META[event.circuit];
  if (!meta) return null;

  return (
    <div className="circuit-map">
      <div className="circuit-info">
        <h4>{meta.name}</h4>
        <p>{meta.lengthKm} km · {meta.corners} curvas</p>
      </div>
      <div className="circuit-image">
        <img src={meta.mapPath} alt={`Traçado do circuito ${meta.name}`} loading="lazy" width={400} height={260} />
      </div>
    </div>
  );
}
