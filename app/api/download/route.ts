import { NextResponse } from "next/server"
import { isPrivateIP } from "@/lib/ssrf-guard"
import { rateLimit, cleanupRateLimit } from "@/lib/rate-limit"

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"

const ALLOWED_HOSTS = new Set([
  "cinesrc.st",
  "vidfast.pro",
  "player.vidlove.cc",
  "play.xpass.top",
  "vidup.to",
  "image.tmdb.org",
  "image.tmdb.org",
])

function isAllowedHost(hostname: string): boolean {
  const lower = hostname.toLowerCase()
  if (ALLOWED_HOSTS.has(lower)) return true
  for (const allowed of ALLOWED_HOSTS) {
    if (lower.endsWith("." + allowed)) return true
  }
  return false
}

function dlFileNameFromUrl(raw: string): string {
  try {
    const u = new URL(raw)
    const last = u.pathname.split("/").filter(Boolean).pop()
    if (last) return decodeURIComponent(last)
  } catch {
    /* ignore */
  }
  return "download.mkv"
}

export async function GET(req: Request) {
  cleanupRateLimit()

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  const rl = rateLimit(`dl:${ip}`, { windowMs: 60_000, max: 10 })
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const { searchParams } = new URL(req.url)
  const raw = String(searchParams.get("url") ?? "")

  let target: URL
  try {
    target = new URL(raw)
  } catch {
    target = null as unknown as URL
  }
  if (!target || (target.protocol !== "https:" && target.protocol !== "http:")) {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 })
  }

  if (!isAllowedHost(target.hostname)) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 })
  }

  if (isPrivateIP(target.hostname)) {
    return NextResponse.json({ error: "Internal hosts not allowed" }, { status: 403 })
  }

  const range = req.headers.get("range")
  const attempts = [0, 1200, 3000]

  for (const delay of attempts) {
    if (delay) await new Promise((r) => setTimeout(r, delay))
    try {
      const upstream = await fetch(target.href, {
        redirect: "follow",
        headers: {
          "User-Agent": BROWSER_UA,
          Referer: target.origin + "/",
          ...(range ? { Range: range } : {}),
        },
      })
      if (!upstream.ok && upstream.status !== 206) continue

      const headers = new Headers()
      headers.set("Content-Disposition", `attachment; filename="${dlFileNameFromUrl(raw)}"`)
      headers.set("Content-Type", upstream.headers.get("content-type") ?? "application/octet-stream")
      const cl = upstream.headers.get("content-length")
      if (cl) headers.set("Content-Length", cl)
      const cr = upstream.headers.get("content-range")
      if (cr) headers.set("Content-Range", cr)
      if (range && cr) headers.set("Accept-Ranges", "bytes")

      return new Response(upstream.body, {
        status: upstream.status,
        headers,
      })
    } catch {
      /* try next attempt */
    }
  }

  return NextResponse.json({ error: "Download failed" }, { status: 502 })
}
