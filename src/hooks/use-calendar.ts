"use client";

import { useEffect, useState } from "react";
import { F1_CALENDAR, F1_SEASONS, type GrandPrixEvent } from "@/data/f1-calendar";

type CalendarMap = Record<number, GrandPrixEvent[]>;

export function useCalendar() {
  const [now, setNow] = useState(() => new Date());
  const [calendar, setCalendar] = useState<CalendarMap>(F1_CALENDAR);
  const [seasons, setSeasons] = useState<number[]>([...F1_SEASONS]);

  useEffect(() => {
    const updateClock = () => setNow(new Date());
    const loadCalendar = async () => {
      try {
        const response = await fetch("/api/calendar", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json() as { events?: CalendarMap; seasons?: number[] };
        if (data.events && data.seasons?.length) {
          setCalendar(data.events);
          setSeasons(data.seasons);
        }
      } catch {
        // Keep the bundled official schedule available if the local route is offline.
      }
    };
    const update = () => {
      const current = new Date();
      setNow(current);
    };
    const clockInterval = setInterval(update, 60_000);
    const refreshInterval = setInterval(() => void loadCalendar(), 5 * 60_000);
    void loadCalendar();
    update();
    return () => { clearInterval(clockInterval); clearInterval(refreshInterval); };
  }, []);

  const today = now.toISOString().slice(0, 10);
  const events = seasons.flatMap((season) => calendar[season] ?? []).sort((a,b) => a.raceDate.localeCompare(b.raceDate));
  const currentEvent = events.find((event) => today >= event.startDate && today <= event.endDate)
    ?? events.find((event) => event.raceDate >= today);
  const nextEvent = events.find((event) => event.endDate >= today);
  const nextAfterToday = events.find((event) => event.startDate > today);

  return { now, calendar, seasons, currentEvent, nextEvent, nextAfterToday };
}
