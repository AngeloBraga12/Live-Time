import { NextResponse } from "next/server";
import { fetchF1LiveHealth, fetchF1LiveSnapshot } from "@/lib/f1-livetiming-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 10;

export async function GET() {
  try {
    const health = await fetchF1LiveHealth();
    if (!health.connected) {
      return NextResponse.json({ connected: false, lastMessageAt: health.lastMessageAt }, { headers: { "Cache-Control": "no-store" } });
    }

    const snapshot = await fetchF1LiveSnapshot(health);
    return NextResponse.json({ connected: true, lastMessageAt: health.lastMessageAt, snapshot }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({
      connected: false,
      lastMessageAt: null,
      error: error instanceof Error ? error.message : "Não foi possível consultar o provedor de timing.",
    }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
