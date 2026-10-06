import { NextResponse } from "next/server"
import { clientIp, rateLimit } from "@/lib/rate-limit"
import { getTrending } from "@/lib/tmdb/client"
import type { TrendingWindow } from "@/lib/tmdb/types"

const CACHE_TTL_SECONDS = 300

export async function GET(req: Request) {
  const rl = await rateLimit(`trending:${clientIp(req)}`, { windowMs: 60_000, max: 120 })
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } })
  }

  const raw = new URL(req.url).searchParams.get("window")
  const window: TrendingWindow = raw === "day" ? "day" : "week"

  try {
    const items = await getTrending("all", window)
    return NextResponse.json(
      { items },
      { headers: { "Cache-Control": `public, max-age=0, s-maxage=${CACHE_TTL_SECONDS}` } },
    )
  } catch {
    return NextResponse.json({ error: "Trending is temporarily unavailable" }, { status: 502 })
  }
}
