import { NextResponse } from "next/server";
import { fetchF1LiveHealth, apiBaseUrl } from "@/lib/f1-livetiming-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json(await fetchF1LiveHealth(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ service: "f1-livetiming-api", connected: false, status: "UNAVAILABLE", lastMessageAt: null, uptimeSeconds: null, timestamp: null, apiBaseUrl, error: error instanceof Error ? error.message : "API indisponível." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
