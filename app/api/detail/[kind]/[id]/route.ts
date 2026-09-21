import { NextRequest, NextResponse } from "next/server"
import { getDetail } from "@/lib/tmdb/client"
import type { MediaKind } from "@/lib/tmdb/types"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ kind: string; id: string }> },
) {
  const { kind: kindRaw, id } = await params
  const kind = kindRaw as MediaKind
  if (kind !== "movie" && kind !== "tv") {
    return NextResponse.json({ error: "invalid kind" }, { status: 400 })
  }
  const detail = await getDetail(kind, Number(id))
  return NextResponse.json(detail)
}