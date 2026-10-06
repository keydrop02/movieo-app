import { NextResponse } from "next/server"
import { clientIp, rateLimit } from "@/lib/rate-limit"
import { getEpisodes } from "@/lib/tmdb/client"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; season: string }> },
) {
  const rl = await rateLimit(`episodes:${clientIp(req)}`, { windowMs: 60_000, max: 120 })
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } })
  }

  const { id, season } = await params
  if (!/^\d{1,9}$/.test(id) || !/^\d{1,4}$/.test(season)) {
    return NextResponse.json({ error: "invalid id or season" }, { status: 400 })
  }

  try {
    const episodes = await getEpisodes(Number(id), Number(season))
    return NextResponse.json(
      { episodes },
      { headers: { "Cache-Control": "public, max-age=0, s-maxage=3600" } },
    )
  } catch {
    return NextResponse.json({ error: "Upstream unavailable" }, { status: 502 })
  }
}
