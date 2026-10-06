import { NextResponse } from "next/server"
import { clientIp, rateLimit } from "@/lib/rate-limit"
import { searchAll } from "@/lib/tmdb/client"

/**
 * Client-driven search: every request fans out to three upstream TMDB pages, so
 * this is the most expensive route in the app and the one most worth throttling.
 * Identical queries are cached briefly at the edge, which absorbs the repeat
 * traffic that would otherwise burn quota.
 */

const CACHE_TTL_SECONDS = 300
const MAX_QUERY_LENGTH = 100

export async function GET(req: Request) {
  const rl = await rateLimit(`search:${clientIp(req)}`, { windowMs: 60_000, max: 30 })
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } })
  }

  const { searchParams } = new URL(req.url)
  const q = (searchParams.get("q") ?? "").trim().slice(0, MAX_QUERY_LENGTH)
  if (!q) return NextResponse.json({ items: [] })

  try {
    const items = await searchAll(q)
    return NextResponse.json(
      { items },
      { headers: { "Cache-Control": `public, max-age=0, s-maxage=${CACHE_TTL_SECONDS}` } },
    )
  } catch {
    return NextResponse.json(
      { error: "Search is temporarily unavailable" },
      { status: 502 },
    )
  }
}
