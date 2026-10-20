import { NextResponse } from "next/server";
import { getLiveSnapshot, unavailable } from "@/lib/f1/source";
import type { LiveTimingPollResponse } from "@/types/live-timing";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 15;

/**
 * Snapshot normalizado da sessão. Usado como alternativa ao streaming
 * (/api/live-timing/stream) quando ele não estiver disponível.
 *
 * O cache de 1 s na CDN faz com que vários visitantes ao mesmo tempo gerem
 * no máximo uma execução da função por segundo.
 */
const CACHE = "public, max-age=0, s-maxage=1, stale-while-revalidate=4";

export async function GET() {
  try {
    const { health, snapshot } = await getLiveSnapshot();
    const body: LiveTimingPollResponse = { connected: health.connected && Boolean(snapshot), lastMessageAt: health.lastMessageAt, ...(snapshot ? { snapshot } : {}) };
    return NextResponse.json(body, { headers: { "Cache-Control": CACHE, "CDN-Cache-Control": "public, s-maxage=1, stale-while-revalidate=4" } });
  } catch (error) {
    const body: LiveTimingPollResponse = { connected: false, lastMessageAt: null, error: unavailable(error).error };
    return NextResponse.json(body, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
