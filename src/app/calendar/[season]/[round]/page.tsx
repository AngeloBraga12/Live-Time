import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { F1_CALENDAR, type GrandPrixEvent } from "@/data/f1-calendar";
import { GrandPrixDetail } from "@/components/calendar/grand-prix-detail";

type RouteParams = { season: string; round: string };

function getEvent({ season, round }: RouteParams): GrandPrixEvent | undefined {
  if (!/^20\d{2}$/.test(season) || !/^\d+$/.test(round)) return undefined;
  return F1_CALENDAR[Number(season)]?.find((event) => event.round === Number(round));
}

export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const event = getEvent(await params);
  return { title: event ? `${event.name} ${event.season}` : "Grande Prêmio" };
}

export default async function GrandPrixPage({ params }: { params: Promise<RouteParams> }) {
  const event = getEvent(await params);
  if (!event) notFound();
  return <GrandPrixDetail event={event} />;
}
