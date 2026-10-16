"use client";

import { useEffect, useState } from "react";

export type F1LiveStatus = { service: string; connected: boolean; status: string; lastMessageAt: string | null; uptimeSeconds: number | null; timestamp: string | null; apiBaseUrl: string; error?: string };

const offline: F1LiveStatus = { service: "f1-livetiming-api", connected: false, status: "CHECKING", lastMessageAt: null, uptimeSeconds: null, timestamp: null, apiBaseUrl: "" };

export function useF1LiveApiStatus() {
  const [health, setHealth] = useState<F1LiveStatus>(offline);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const readStatus = async () => {
      try {
        const response = await fetch("/api/f1-live/status", { cache: "no-store", signal: controller.signal });
        const data = await response.json() as F1LiveStatus;
        if (active) setHealth(data);
      } catch {
        if (active) setHealth((current) => ({ ...current, connected: false, status: "UNAVAILABLE", error: "Não foi possível acessar a API de timing configurada." }));
      }
    };
    void readStatus();
    const interval = window.setInterval(() => void readStatus(), 5000);
    return () => { active = false; controller.abort(); window.clearInterval(interval); };
  }, []);
  return health;
}
