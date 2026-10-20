"use client";

import { useEffect } from "react";
import { useLiveTimingStore } from "@/store/live-timing-store";
import type { LiveTimingPollResponse } from "@/types/live-timing";

const STREAM_URL = "/api/live-timing/stream";
const POLL_URL = "/api/live-timing";
const POLL_MS = 2000;
/** Erros seguidos do stream (sem receber nada) antes de cair para polling. */
const MAX_STREAM_FAILURES = 3;
/** Depois de cair para polling, tenta o stream de novo após este tempo. */
const STREAM_RETRY_MS = 60_000;
/** Aba em segundo plano por este tempo: pausa a conexão para poupar a cota gratuita. */
const HIDDEN_PAUSE_MS = 120_000;

/**
 * Conecta o painel ao live timing assim que a página abre.
 *
 * 1. Usa Server-Sent Events (/api/live-timing/stream): atualização a cada ~1 s.
 *    O servidor fecha o stream periodicamente (limite das funções serverless)
 *    e o navegador reabre sozinho.
 * 2. Se o stream falhar repetidamente, consulta /api/live-timing a cada 2 s e
 *    volta a tentar o stream depois de um minuto.
 */
export function useLiveTiming() {
  const setConnection = useLiveTimingStore((state) => state.setConnection);
  const applySnapshot = useLiveTimingStore((state) => state.applySnapshot);
  const applyTiming = useLiveTimingStore((state) => state.applyTiming);

  useEffect(() => {
    let active = true;
    let hasSnapshot = false;
    let source: EventSource | null = null;
    let streamFailures = 0;
    let pollTimer: number | undefined;
    let retryTimer: number | undefined;
    let hiddenTimer: number | undefined;
    let pollController: AbortController | undefined;
    let paused = false;

    const apply = (result: LiveTimingPollResponse) => {
      if (!active) return;
      if (!result.connected || !result.snapshot) { setConnection("offline"); return; }
      if (hasSnapshot) applyTiming(result.snapshot);
      else { applySnapshot(result.snapshot); hasSnapshot = true; }
      setConnection("live");
    };

    const stopPolling = () => {
      if (pollTimer) window.clearTimeout(pollTimer);
      pollTimer = undefined;
      pollController?.abort();
    };

    const poll = async () => {
      pollController = new AbortController();
      try {
        const response = await fetch(POLL_URL, { cache: "no-store", signal: pollController.signal });
        apply(await response.json() as LiveTimingPollResponse);
      } catch {
        if (active && !pollController.signal.aborted) setConnection("offline");
      } finally {
        if (active && !paused && !source) pollTimer = window.setTimeout(() => void poll(), POLL_MS);
      }
    };

    const closeStream = () => { source?.close(); source = null; };

    const openStream = () => {
      if (!active || paused) return;
      if (typeof EventSource === "undefined") { void poll(); return; }
      stopPolling();
      closeStream();
      const stream = new EventSource(STREAM_URL);
      source = stream;
      stream.addEventListener("snapshot", (event) => {
        streamFailures = 0;
        try { apply(JSON.parse((event as MessageEvent<string>).data) as LiveTimingPollResponse); } catch { /* quadro inválido */ }
      });
      stream.addEventListener("offline", () => { streamFailures = 0; if (active) setConnection("offline"); });
      stream.onerror = () => {
        // O fim normal da janela do servidor também cai aqui; o EventSource reabre sozinho.
        streamFailures += 1;
        if (streamFailures < MAX_STREAM_FAILURES && stream.readyState !== EventSource.CLOSED) return;
        closeStream();
        if (!active) return;
        if (!hasSnapshot) setConnection("connecting");
        void poll();
        retryTimer = window.setTimeout(() => { streamFailures = 0; openStream(); }, STREAM_RETRY_MS);
      };
    };

    const onVisibility = () => {
      if (document.hidden) {
        hiddenTimer = window.setTimeout(() => { paused = true; closeStream(); stopPolling(); }, HIDDEN_PAUSE_MS);
      } else {
        if (hiddenTimer) window.clearTimeout(hiddenTimer);
        if (paused) { paused = false; streamFailures = 0; openStream(); }
      }
    };

    // Ao sair da página o navegador fecha o stream; não é falha, não cai para polling.
    const onPageHide = () => { active = false; closeStream(); stopPolling(); };

    setConnection("connecting");
    openStream();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      active = false;
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      closeStream();
      stopPolling();
      if (retryTimer) window.clearTimeout(retryTimer);
      if (hiddenTimer) window.clearTimeout(hiddenTimer);
    };
  }, [applySnapshot, applyTiming, setConnection]);
}
