"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const LINKS = [
  { href: "/", label: "Ao vivo" },
  { href: "/calendar", label: "Calendário" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  return <header className="site-header">
    <div className="site-header-inner">
      <Link href="/" className="wordmark" aria-label="Apex Timing, página inicial">
        <span className="wordmark-strong">Apex</span><span className="wordmark-light">Timing</span>
      </Link>
      <nav className="site-nav" aria-label="Principal">
        {LINKS.map((link) => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined}>{link.label}</Link>)}
      </nav>
      <ThemeToggle />
    </div>
  </header>;
}
