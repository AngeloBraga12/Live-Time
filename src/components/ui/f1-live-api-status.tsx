"use client";

import { useF1LiveApiStatus } from "@/hooks/use-f1-live-api-status";

export function F1LiveApiStatus({ compact = false }: { compact?: boolean }) {
  const health = useF1LiveApiStatus();
  return <span className={`f1-api-status ${health.connected ? "is-connected" : "is-offline"} ${compact ? "compact" : ""}`} title={`${health.service} · ${health.apiBaseUrl}`}><i/>{compact ? "F1 LIVE" : health.connected ? "F1 API · CONECTADA" : health.status === "CHECKING" ? "F1 API · VERIFICANDO" : "F1 API · OFFLINE"}</span>;
}
