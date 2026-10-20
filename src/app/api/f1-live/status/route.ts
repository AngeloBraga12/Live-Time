import { NextResponse } from "next/server";
import { getFeedHealth, unavailable } from "@/lib/f1/source";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 15;

export async function GET() {
  try {
    const health = await getFeedHealth();
    return NextResponse.json(health, { headers: { "Cache-Control": "public, max-age=0, s-maxage=2, stale-while-revalidate=5", "CDN-Cache-Control": "public, s-maxage=2, stale-while-revalidate=5" } });
  } catch (error) {
    return NextResponse.json(unavailable(error), { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
