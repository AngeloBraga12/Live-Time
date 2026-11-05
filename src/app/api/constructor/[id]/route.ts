import { NextRequest, NextResponse } from "next/server";
import { fetchConstructorHistory } from "@/lib/f1/history";

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
    const history = await fetchConstructorHistory(id);
    if (!history) {
      return NextResponse.json({ error: "Equipe não encontrada" }, { status: 404 });
    }
    return NextResponse.json(history, {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error(`[API/constructor/${id}]`, error);
    return NextResponse.json({ error: "Falha ao buscar histórico da equipe" }, { status: 502 });
  }
}