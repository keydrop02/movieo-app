import { NextResponse } from "next/server"
import { clientIp, rateLimit } from "@/lib/rate-limit"

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"

const ALLOWED_HOSTS = new Set([
  "cinesrc.st",
  "vidfast.pro",
  "player.vidlove.cc",
  "vidlove.cc",
  "play.xpass.top",
  "xpass.top",
  "vidup.to",
  "image.tmdb.org",
])

/** Upstream fetch budget. Keeps a slow embed from pinning a Worker invocation. */
const UPSTREAM_TIMEOUT_MS = 20_000
/** Redirect hops we are willing to walk. */
const MAX_REDIRECTS = 3

export function isAllowedHost(hostname: string): boolean {
  const lower = hostname.toLowerCase()
  if (ALLOWED_HOSTS.has(lower)) return true
  for (const allowed of ALLOWED_HOSTS) {
    if (lower.endsWith("." + allowed)) return true
  }
  return false
}

/**
 * Reject anything that is not an allowlisted host over https.
 *
 * The allowlist is the whole SSRF control here. Every permitted host is a
 * public CDN name we control the relationship with, so an allowlist entry is a
 * stronger guarantee than a private-IP blocklist: a blocklist has to anticipate
 * every private range and every DNS rebinding trick, whereas the allowlist only
 * permits names we already decided are safe.
 *
 * The control only holds if it is applied to every hop, which is why
 * `fetchRedirectSafely` below re-runs this check after each redirect instead of
 * handing the job to `redirect: "follow"`.
 */
function assertSafeTarget(url: URL): void {
  if (url.protocol !== "https:") {
    throw new SSRFError("protocol")
  }
  if (!isAllowedHost(url.hostname)) {
    throw new SSRFError("host")
  }
}

class SSRFError extends Error {
  constructor(readonly reason: "protocol" | "host" | "redirects" | "fetch") {
    super(reason)
  }
}

/**
 * Fetch a URL, validating every redirect hop.
 *
 * Using `redirect: "follow"` here would defeat the allowlist entirely: only the
 * initial URL is checked, so an allowlisted host that answers with a 302 to
 * `http://169.254.169.254/` would be followed and its body streamed back to the
 * caller. Following manually lets us re-validate the destination each time.
 */
async function fetchRedirectSafely(initial: URL, init: RequestInit = {}): Promise<Response> {
  let current = initial

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    try {
      assertSafeTarget(current)
    } catch (err) {
      throw err instanceof SSRFError ? err : new SSRFError("host")
    }

    const res = await fetch(current.href, {
      ...init,
      redirect: "manual",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      headers: {
        ...(init.headers as Record<string, string> | undefined),
        "User-Agent": BROWSER_UA,
        Referer: current.origin + "/",
      },
    })

    const isRedirect = res.status === 301 || res.status === 302 || res.status === 303 || res.status === 307 || res.status === 308
    if (!isRedirect) return res

    const location = res.headers.get("location")
    if (!location) return res

    if (hop === MAX_REDIRECTS) throw new SSRFError("redirects")

    let next: URL
    try {
      next = new URL(location, current.href)
    } catch {
      throw new SSRFError("host")
    }
    current = next
  }

  throw new SSRFError("redirects")
}

/**
 * Derive a download filename from a URL path segment.
 *
 * The raw segment is attacker-influenced (it comes from the upstream JSON, and
 * the endpoint itself is public), so it must not be interpolated into a header
 * verbatim: quotes would break out of the `filename="..."` quoting and
 * CR/LF would be a header-splitting attempt. Everything outside a conservative
 * allowlist is dropped, and the result is length-capped.
 */
function safeFileName(raw: string): string {
  let candidate = "download.mkv"
  try {
    const u = new URL(raw)
    const last = u.pathname.split("/").filter(Boolean).pop()
    if (last) {
      let decoded = last
      try {
        decoded = decodeURIComponent(last)
      } catch {
        /* keep the raw segment when it is not valid percent-encoding */
      }
      const cleaned = decoded
        .replace(/[^A-Za-z0-9._ -]/g, "")
        .replace(/^\.+/, "")
        .trim()
      if (cleaned) candidate = cleaned.slice(0, 120)
    }
  } catch {
    /* fall through to the default name */
  }
  return candidate
}

export async function GET(req: Request) {
  const rl = await rateLimit(`dl:${clientIp(req)}`, { windowMs: 60_000, max: 10 })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": "60" } },
    )
  }

  const { searchParams } = new URL(req.url)
  const raw = String(searchParams.get("url") ?? "")

  let target: URL
  try {
    target = new URL(raw)
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 })
  }

  try {
    assertSafeTarget(target)
  } catch {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 })
  }

  const range = req.headers.get("range")
  // One retry for a transient upstream failure; the redirect budget is handled
  // inside the fetch helper.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const upstream = await fetchRedirectSafely(target, {
        headers: range ? { Range: range } : undefined,
      })

      if (!upstream.ok && upstream.status !== 206) {
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 400))
          continue
        }
        return NextResponse.json({ error: `Upstream returned ${upstream.status}` }, { status: 502 })
      }

      const headers = new Headers()
      headers.set("Content-Disposition", `attachment; filename="${safeFileName(raw)}"`)
      headers.set("Content-Type", upstream.headers.get("content-type") ?? "application/octet-stream")
      headers.set("X-Content-Type-Options", "nosniff")

      const contentLength = upstream.headers.get("content-length")
      if (contentLength) headers.set("Content-Length", contentLength)
      const contentRange = upstream.headers.get("content-range")
      if (contentRange) headers.set("Content-Range", contentRange)
      if (range && contentRange) headers.set("Accept-Ranges", "bytes")
      // The body is an opaque byte stream from a third party; never let a
      // browser sniff or embed it in our origin.
      headers.set("Cache-Control", "no-store")

      return new Response(upstream.body, { status: upstream.status, headers })
    } catch (err) {
      if (err instanceof SSRFError && err.reason !== "fetch") {
        // A redirect tried to leave the allowlist. Do not follow, do not
        // disclose the destination.
        return NextResponse.json({ error: "Host not allowed" }, { status: 403 })
      }
      if (attempt === 0) continue
      return NextResponse.json({ error: "Download failed" }, { status: 502 })
    }
  }

  return NextResponse.json({ error: "Download failed" }, { status: 502 })
}
