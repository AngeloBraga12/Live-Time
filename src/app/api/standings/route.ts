import { NextResponse } from "next/server";
import { fetchChampionship } from "@/lib/f1/standings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const seasonParam = searchParams.get("season");
  const season = seasonParam ? Number(seasonParam) : 2026;

  try {
    const data = await fetchChampionship(Number.isFinite(season) ? season : 2026);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao carregar classificação do campeonato." },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
