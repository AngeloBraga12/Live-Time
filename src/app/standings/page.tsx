import { Metadata } from "next";
import { StandingsPageClient } from "./standings-page-client";

export const metadata: Metadata = { title: "Campeonato · Apex Timing" };

export default function StandingsPage() {
  return <StandingsPageClient />;
}
