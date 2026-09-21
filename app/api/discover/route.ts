import { NextRequest, NextResponse } from "next/server"
import { discover } from "@/lib/tmdb/client"
import type { MediaKind } from "@/lib/tmdb/types"

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const kind = (sp.get("kind") as MediaKind) || "movie"
  const voteMinRaw = sp.get("voteMin")
  const minVotesRaw = sp.get("minVotes")
  const pageRaw = sp.get("page")
  const voteMin = voteMinRaw ? Number(voteMinRaw) : undefined
  const minVotes = minVotesRaw !== null ? Number(minVotesRaw) || undefined : undefined
  const page = pageRaw ? Number(pageRaw) : undefined
  const params = {
    genre: sp.get("genre") ?? undefined,
    year: sp.get("year") ?? undefined,
    voteMin,
    minVotes,
    provider: sp.get("provider") ?? undefined,
    sort: (sp.get("sort") as "popular" | "rating" | undefined) ?? undefined,
    country: sp.get("country") ?? undefined,
    page,
  }
  const result = await discover(kind, params)
  return NextResponse.json(result)
}