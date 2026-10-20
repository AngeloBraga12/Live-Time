"use client";

import Link from "next/link";
import { Activity, CalendarDays, Gauge, LayoutGrid, RadioTower, Settings2 } from "lucide-react";
import { F1LiveApiStatus } from "@/components/ui/f1-live-api-status";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useLiveTiming } from "@/hooks/use-live-timing";

const links = [
  ["/multiview", "Multiview", LayoutGrid],
  ["/timing", "Live Timing", Activity],
  ["/calendar", "Calendário", CalendarDays],
  ["/telemetry", "Telemetria", Gauge],
  ["/race-control", "Race Control", RadioTower],
  ["/settings", "Conexão", Settings2],
] as const;

export function SectionWorkspace({ active, title, description, children }: { active: string; title: string; description?: string; children: React.ReactNode }) {
  useLiveTiming();
  return <main className="app-frame">
    <div className="shell-main">
      <header className="topbar">
        <Link className="apex-brand" href="/multiview" aria-label="Apex, início"><span className="apex-mark">A</span><span>APEX</span></Link>
        <nav className="primary-nav" aria-label="Navegação principal">
          {links.map(([href, label, Icon]) => <Link key={href} className={`primary-nav-link ${active === href ? "active" : ""}`} href={href}><Icon size={16} aria-hidden="true"/><span>{label}</span></Link>)}
        </nav>
        <div className="topbar-right"><F1LiveApiStatus/><ThemeToggle/></div>
      </header>
      <section className="section-screen-heading"><div><span className="widget-kicker">APEX TIMING / {title.toUpperCase()}</span><h1>{title}</h1><p>{description ?? "Dados apresentados conforme a disponibilidade da sessão selecionada."}</p></div></section>
      {children}
      <footer className="app-footer"><span>APEX TIMING <b>v0.3</b></span><span>F1 LIVE TIMING · SIGNALR / SSE</span><span>ATUALIZAÇÃO · 1s</span></footer>
    </div>
  </main>;
}
