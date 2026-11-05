"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const LINKS = [
  { href: "/", label: "Ao vivo" },
  { href: "/standings", label: "Campeonato" },
  { href: "/calendar", label: "Calendário" },
  { href: "/drivers", label: "Pilotos" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const updateIndicator = () => {
      const activeLink = nav.querySelector<HTMLAnchorElement>('a[aria-current="page"]');
      if (!activeLink) return;
      setIndicator({ left: activeLink.offsetLeft, width: activeLink.offsetWidth });
    };

    updateIndicator();
    const observer = new ResizeObserver(updateIndicator);
    observer.observe(nav);
    nav.querySelectorAll("a").forEach((link) => observer.observe(link));
    return () => observer.disconnect();
  }, [pathname]);

  return <header className="site-header">
    <div className="site-header-inner">
      <Link href="/" className="wordmark" aria-label="Apex Timing, página inicial">
        <span className="wordmark-strong">Apex</span><span className="wordmark-light">Timing</span>
      </Link>
      <nav className="site-nav" aria-label="Principal" ref={navRef}>
        {LINKS.map((link) => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined}>{link.label}</Link>)}
        {indicator && <span aria-hidden="true" className="site-nav-indicator" style={{ width: indicator.width, transform: `translateX(${indicator.left}px)` }} />}
      </nav>
      <ThemeToggle />
    </div>
  </header>;
}
