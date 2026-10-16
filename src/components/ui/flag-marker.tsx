import { Flag } from "lucide-react";
import type { RaceControlSeverity } from "@/types/live-timing";

export function FlagMarker({ severity }: { severity: RaceControlSeverity }) {
  return <span className={`flag-marker marker-${severity}`}><Flag size={13} strokeWidth={2.2} /></span>;
}
