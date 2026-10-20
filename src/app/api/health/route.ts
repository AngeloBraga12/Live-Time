import { NextResponse } from "next/server";
import { getFeedHealth, unavailable } from "@/lib/f1/source";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 15;

/**
 * Health check. Responde 200 sempre que o site estiver de pé; o estado do
 * feed da F1 vai no corpo (fora de sessões ao vivo ele pode estar vazio).
 */
export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  try {
    return NextResponse.json({ ok: true, site: "up", feed: await getFeedHealth() }, { headers });
  } catch (error) {
    return NextResponse.json({ ok: true, site: "up", feed: unavailable(error) }, { headers });
  }
}
