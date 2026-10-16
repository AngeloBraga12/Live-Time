import { NextResponse } from "next/server";
import { apiBaseUrl, fetchF1LiveHealth } from "@/lib/f1-livetiming-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Health check da plataforma de deploy. Responde 200 enquanto o site estiver de pé.
 * Fora de sessões ao vivo a API pode ficar desconectada do feed da F1; isso é normal
 * e NÃO deve derrubar o container, por isso o estado do feed vai só no corpo.
 */
export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  try {
    const feed = await fetchF1LiveHealth();
    return NextResponse.json({ ok: true, site: "up", feed }, { headers });
  } catch (error) {
    return NextResponse.json({
      ok: true,
      site: "up",
      feed: { service: "f1-livetiming-api", connected: false, status: "UNAVAILABLE", apiBaseUrl, error: error instanceof Error ? error.message : "API indisponível." },
    }, { headers });
  }
}
