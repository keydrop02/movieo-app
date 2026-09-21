import { NextResponse } from "next/server"
import { getEpisodes } from "@/lib/tmdb/client"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; season: string }> },
) {
  const { id, season } = await params
  const episodes = await getEpisodes(Number(id), Number(season) || 1)
  return NextResponse.json({ episodes })
}