import { NextResponse } from "next/server"
import { clientIp, rateLimit } from "@/lib/rate-limit"

/**
 * Same-origin proxy for the upstream download-link index.
 *
 * The client used to call the third-party API directly from the browser. That
 * meant two independent failure modes: the host was missing from our own CSP
 * `connect-src`, so every request was blocked in production while working
 * perfectly in `next dev` (which does not serve `next.config.ts` headers); and
 * the whole feature silently depended on that host continuing to send permissive
 * CORS headers. Proxying through our own origin removes both.
 */

const UPSTREAM = "https://downloads.shegu.st"
const UPSTREAM_TIMEOUT_MS = 10_000
const CACHE_TTL_SECONDS = 300

/** Ids are interpolated into an upstream path, so they must be plain integers. */
function parseId(raw: string | null): number | null {
  if (!raw) return null
  if (!/^\d{1,9}$/.test(raw)) return null
  const n = Number(raw)
  return Number.isSafeInteger(n) && n > 0 ? n : null
}

export async function GET(req: Request) {
  const rl = await rateLimit(`dlidx:${clientIp(req)}`, { windowMs: 60_000, max: 30 })
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } })
  }

  const { searchParams } = new URL(req.url)
  const kind = searchParams.get("kind")
  const id = parseId(searchParams.get("id"))

  if (kind !== "movie" && kind !== "tv") {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 })
  }
  if (id === null) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  let path: string
  if (kind === "movie") {
    path = `/movie/${id}`
  } else {
    const season = parseId(searchParams.get("season"))
    const episode = parseId(searchParams.get("episode"))
    if (season === null || episode === null) {
      return NextResponse.json({ error: "Invalid season or episode" }, { status: 400 })
    }
    path = `/tv/${id}/${season}/${episode}`
  }

  try {
    const res = await fetch(UPSTREAM + path, {
      redirect: "follow",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      headers: { Accept: "application/json" },
      next: { revalidate: CACHE_TTL_SECONDS },
    })

    if (!res.ok) {
      return NextResponse.json({ error: "Upstream unavailable" }, { status: 502 })
    }

    const data: unknown = await res.json()

    // Only forward the shape the modal consumes. Passing an arbitrary upstream
    // body straight through to the client would let the third party choose the
    // URLs a user's browser later requests.
    const links = Array.isArray((data as { links?: unknown })?.links)
      ? (data as { links: unknown[] }).links
          .filter((l): l is Record<string, unknown> => !!l && typeof l === "object")
          .map((l) => ({
            url: typeof l.url === "string" ? l.url : "",
            quality: typeof l.quality === "number" ? l.quality : undefined,
            size: typeof l.size === "string" ? l.size : undefined,
            provider: typeof l.provider === "string" ? l.provider : undefined,
            source: typeof l.source === "string" ? l.source : undefined,
          }))
          .filter((l) => l.url.startsWith("https://"))
      : []

    return NextResponse.json(
      { links },
      { headers: { "Cache-Control": `public, max-age=0, s-maxage=${CACHE_TTL_SECONDS}` } },
    )
  } catch {
    return NextResponse.json({ error: "Upstream unavailable" }, { status: 502 })
  }
}
