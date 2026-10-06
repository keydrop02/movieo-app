import { NextResponse } from "next/server"
import { clientIp, rateLimit } from "@/lib/rate-limit"
import { getDetail } from "@/lib/tmdb/client"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ kind: string; id: string }> },
) {
  const rl = await rateLimit(`detail:${clientIp(req)}`, { windowMs: 60_000, max: 120 })
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } })
  }

  const { kind: kindRaw, id } = await params
  const kind = kindRaw as "movie" | "tv"
  if (kind !== "movie" && kind !== "tv") {
    return NextResponse.json({ error: "invalid kind" }, { status: 400 })
  }
  // Reject non-integer ids here. `Number("abc")` is NaN, which used to be
  // forwarded upstream as the literal path segment `/movie/NaN` — three failed
  // attempts with exponential backoff before a 500.
  if (!/^\d{1,9}$/.test(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 })
  }

  try {
    const detail = await getDetail(kind, Number(id))
    if (!detail.title) {
      return NextResponse.json({ error: "not found" }, { status: 404 })
    }
    return NextResponse.json(
      detail,
      { headers: { "Cache-Control": "public, max-age=0, s-maxage=3600" } },
    )
  } catch {
    return NextResponse.json({ error: "Upstream unavailable" }, { status: 502 })
  }
}
