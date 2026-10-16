import { NextResponse } from "next/server"
import { clientIp, rateLimit } from "@/lib/rate-limit"
import { discover } from "@/lib/tmdb/client"

const CACHE_TTL_SECONDS = 300

/** Reject anything that is not a finite integer, so `?page=abc` never becomes NaN. */
function parseIntParam(raw: string | null, min: number, max: number): number | undefined {
  if (raw === null || raw === "") return undefined
  if (!/^-?\d{1,9}$/.test(raw)) return undefined
  const n = Number(raw)
  if (!Number.isFinite(n) || n < min || n > max) return undefined
  return n
}

/** TMDB filter params are numeric ids/years; drop anything else before it reaches the API. */
function parseIdParam(raw: string | null): string | undefined {
  if (raw === null || raw === "") return undefined
  if (!/^\d{1,9}$/.test(raw)) return undefined
  return raw
}

export async function GET(req: Request) {
  const rl = await rateLimit(`discover:${clientIp(req)}`, { windowMs: 60_000, max: 120 })
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } })
  }

  const sp = new URL(req.url).searchParams
  const kind = sp.get("kind")
  if (kind !== "movie" && kind !== "tv") {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 })
  }

  const sortRaw = sp.get("sort")
  const sort =
    sortRaw === "popular" || sortRaw === "rating" || sortRaw === "voted" || sortRaw === "newest" || sortRaw === "oldest" || sortRaw === "title-az"
      ? sortRaw
      : undefined

  try {
    const result = await discover(kind, {
      genre: parseIdParam(sp.get("genre")),
      year: parseIdParam(sp.get("year")),
      voteMin: parseIntParam(sp.get("voteMin"), 0, 10),
      minVotes: parseIntParam(sp.get("minVotes"), 0, 100_000),
      provider: parseIdParam(sp.get("provider")),
      sort,
      // Country is a display name from our fixed list, not an id; cap the
      // length so arbitrary strings never reach TMDB.
      country: sp.get("country")?.slice(0, 64) || undefined,
      page: parseIntParam(sp.get("page"), 1, 500),
    })
    return NextResponse.json(
      result,
      { headers: { "Cache-Control": `public, max-age=0, s-maxage=${CACHE_TTL_SECONDS}` } },
    )
  } catch {
    return NextResponse.json({ error: "Discover is temporarily unavailable" }, { status: 502 })
  }
}
