import type { TrackFlag } from "@/types/live-timing";

const flagLabel: Record<TrackFlag, string> = {
  unknown: "STATUS DESCONHECIDO", green: "GREEN FLAG", yellow: "YELLOW FLAG", "double-yellow": "DOUBLE YELLOW", red: "RED FLAG", blue: "BLUE FLAG", chequered: "CHEQUERED",
};

export function StatusPill({ flag }: { flag: TrackFlag }) {
  return <span className={`status-pill flag-${flag}`}><i />{flagLabel[flag]}</span>;
}
