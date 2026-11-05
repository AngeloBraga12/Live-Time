import { NextRequest, NextResponse } from "next/server";
import { fetchDriverHistory } from "@/lib/f1/history";

export const revalidate = 3600;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || !/^[a-z0-9_]+$/.test(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const history = await fetchDriverHistory(id);
    if (!history) {
      return NextResponse.json({ error: "Piloto não encontrado" }, { status: 404 });
    }
    return NextResponse.json(history, {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error(`[API/driver/${id}]`, error);
    return NextResponse.json({ error: "Falha ao buscar histórico do piloto" }, { status: 502 });
  }
}