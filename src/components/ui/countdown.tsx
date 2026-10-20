"use client";

import { useEffect, useState } from "react";

const ZERO = { days: 0, hours: 0, minutes: 0, seconds: 0 };

function remaining(target: string, dateOnly: boolean, nowMs: number) {
  if (dateOnly) {
    const targetDate = new Date(`${target.slice(0, 10)}T00:00:00`);
    const now = new Date(nowMs);
    const targetDay = Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    return { days: Math.max(0, Math.floor((targetDay - today) / 86400000)), hours: 0, minutes: 0, seconds: 0 };
  }
  const seconds = Math.max(0, Math.floor((new Date(target).getTime() - nowMs) / 1000));
  return { days: Math.floor(seconds / 86400), hours: Math.floor((seconds % 86400) / 3600), minutes: Math.floor((seconds % 3600) / 60), seconds: seconds % 60 };
}

export function Countdown({ target, label = "Próximo evento", dateOnly = false }: { target: string; label?: string; dateOnly?: boolean }) {
  // null até montar no navegador: o HTML do servidor mostra zeros e evita diferença de hidratação.
  const [nowMs, setNowMs] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNowMs(Date.now());
    const first = setTimeout(tick, 0);
    const interval = setInterval(tick, dateOnly ? 60_000 : 1000);
    return () => { clearTimeout(first); clearInterval(interval); };
  }, [dateOnly]);
  const time = nowMs == null ? ZERO : remaining(target, dateOnly, nowMs);
  return <div className={`countdown-values ${dateOnly ? "date-only" : ""}`} aria-label={`${time.days} dias até ${label}`}>
    {dateOnly ? <div className="countdown-date-only"><strong>{time.days}</strong><span>DIAS</span></div> : ([ ["DIAS", time.days], ["HRS", time.hours], ["MIN", time.minutes], ["SEG", time.seconds] ] as const).map(([unit, value]) => <div className="countdown-unit" key={unit}><strong>{String(value).padStart(2, "0")}</strong><span>{unit}</span></div>)}
  </div>;
}
