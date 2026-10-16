import { F1_CALENDAR, F1_CALENDAR_SOURCES, F1_SEASONS, nextGrandPrix } from "@/data/f1-calendar";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date();
  return Response.json({ seasons: F1_SEASONS, events: F1_CALENDAR, sources: F1_CALENDAR_SOURCES, nextEvent: nextGrandPrix(now) }, {
    headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" },
  });
}
