"use client";

import { useEffect, useState } from "react";

function remaining(target: string, dateOnly = false) {
  if (dateOnly) {
    const targetDate = new Date(`${target.slice(0, 10)}T00:00:00`);
    const now = new Date();
    const targetDay = Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    return { days: Math.max(0, Math.floor((targetDay - today) / 86400000)), hours: 0, minutes: 0, seconds: 0 };
  }
  const seconds = Math.max(0, Math.floor((new Date(target).getTime() - Date.now()) / 1000));
  return { days: Math.floor(seconds / 86400), hours: Math.floor((seconds % 86400) / 3600), minutes: Math.floor((seconds % 3600) / 60), seconds: seconds % 60 };
}

export function Countdown({ target, label = "Próximo evento", dateOnly = false }: { target: string; label?: string; dateOnly?: boolean }) {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    setTime(remaining(target, dateOnly));
    const interval = setInterval(() => setTime(remaining(target, dateOnly)), dateOnly ? 60_000 : 1000);
    return () => clearInterval(interval);
  }, [target, dateOnly]);
  return <div className={`countdown-values ${dateOnly ? "date-only" : ""}`} aria-label={`${time.days} dias até ${label}`}>
    {dateOnly ? <div className="countdown-date-only"><strong>{time.days}</strong><span>DIAS</span></div> : ([ ["DIAS", time.days], ["HRS", time.hours], ["MIN", time.minutes], ["SEG", time.seconds] ] as const).map(([unit, value]) => <div className="countdown-unit" key={unit}><strong>{String(value).padStart(2, "0")}</strong><span>{unit}</span></div>)}
  </div>;
}
