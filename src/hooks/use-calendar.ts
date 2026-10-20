"use client";

import { useEffect, useState } from "react";
import { F1_CALENDAR, F1_SEASONS, type GrandPrixEvent } from "@/data/f1-calendar";

const ALL_EVENTS: GrandPrixEvent[] = F1_SEASONS.flatMap((season) => F1_CALENDAR[season]).sort((a, b) => a.raceDate.localeCompare(b.raceDate));

/**
 * Calendário embutido + data de hoje (UTC, AAAA-MM-DD).
 *
 * `today` começa como null: as páginas são pré-renderizadas no build, então a
 * data só é lida no navegador, o que evita mostrar a etapa errada ou causar
 * diferença de hidratação. Atualiza a cada minuto.
 */
export function useCalendar() {
  const [today, setToday] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setToday(new Date().toISOString().slice(0, 10));
    const first = setTimeout(update, 0);
    const interval = setInterval(update, 60_000);
    return () => { clearTimeout(first); clearInterval(interval); };
  }, []);

  if (!today) return { today, events: ALL_EVENTS, currentEvent: undefined, nextAfterToday: undefined };

  /** Etapa cujo fim de semana inclui hoje; senão, a próxima. */
  const currentEvent = ALL_EVENTS.find((event) => today >= event.startDate && today <= event.endDate)
    ?? ALL_EVENTS.find((event) => event.startDate > today);
  /** Primeira etapa que começa depois de hoje. */
  const nextAfterToday = ALL_EVENTS.find((event) => event.startDate > today);

  return { today, events: ALL_EVENTS, currentEvent, nextAfterToday };
}

/** Compara o nome da etapa do feed com uma etapa do calendário (sem acentos, minúsculas). */
export function feedMatchesEvent(meetingName: string, event: GrandPrixEvent | undefined) {
  if (!event || !meetingName.trim()) return false;
  const fold = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const meeting = fold(meetingName);
  return [event.name, event.location, event.country].some((alias) => alias.length > 3 && meeting.includes(fold(alias)));
}
