"use client";

import { useEffect } from "react";
import { useLiveTimingStore } from "@/store/live-timing-store";
import type { LiveTimingPollResponse } from "@/types/live-timing";

/** Polls the short-lived Next route so serverless hosts do not need a permanent SSE invocation. */
export function useLiveTiming() {
  const setConnection = useLiveTimingStore((state) => state.setConnection);
  const applySnapshot = useLiveTimingStore((state) => state.applySnapshot);
  const applyTiming = useLiveTimingStore((state) => state.applyTiming);
  const addRaceControl = useLiveTimingStore((state) => state.addRaceControl);

  useEffect(() => {
    let active = true;
    let hasSnapshot = false;
    let timer: number | undefined;
    let controller: AbortController | undefined;
    setConnection("connecting");

    const poll = async () => {
      controller = new AbortController();
      try {
        const response = await fetch("/api/live-timing", { cache: "no-store", signal: controller.signal });
        const result = await response.json() as LiveTimingPollResponse;
        if (!active) return;

        if (!response.ok || !result.connected || !result.snapshot) {
          setConnection("offline");
          return;
        }

        if (hasSnapshot) applyTiming(result.snapshot);
        else {
          applySnapshot(result.snapshot);
          hasSnapshot = true;
        }
        setConnection("live");
      } catch {
        if (active && !controller.signal.aborted) setConnection("offline");
      } finally {
        if (active) timer = window.setTimeout(() => void poll(), 3000);
      }

    };

    void poll();
    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
      controller?.abort();
    };
  }, [applySnapshot, applyTiming, setConnection]);
}
