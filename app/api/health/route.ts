import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * Deployment smoke target.
 *
 * Deliberately does not touch TMDB: a deploy check should fail only when the
 * app itself is broken or misconfigured, not when a third-party API is slow or
 * rate limited. Returns `checks.env` so a missing `TMDB_API_KEYS` in the Worker
 * environment surfaces here instead of on the first user request.
 */
export async function GET() {
  const checks: Record<string, "ok" | "missing"> = {
    env: process.env.TMDB_API_KEYS ? "ok" : "missing",
  }

  const healthy = Object.values(checks).every((status) => status === "ok")

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      checks,
      timestamp: new Date().toISOString(),
    },
    {
      status: healthy ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  )
}
