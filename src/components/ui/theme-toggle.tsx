"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

/**
 * O tema vive no atributo data-theme do <html> (aplicado pelo script do
 * layout antes da primeira pintura). O botão lê esse atributo com
 * useSyncExternalStore e reage a qualquer mudança dele.
 */
function subscribeTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}
function readTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, (): Theme => "light");

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("apex-theme", next); } catch { /* Keep the in-page choice if storage is unavailable. */ }
  }

  const nextLabel = theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro";
  return (
    <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={nextLabel} title={nextLabel}>
      {theme === "dark" ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </button>
  );
}
