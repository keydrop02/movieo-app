/**
 * Rate limiting.
 *
 * Two backends, picked at runtime:
 *
 *  1. A Cloudflare Workers rate-limiting binding, when one is bound as
 *     `RATE_LIMITER`. This is the only backend that is actually correct on
 *     Workers, because module state is per-isolate: a cold isolate starts with
 *     an empty counter, and a warm one may be a different edge location than
 *     the last request.
 *  2. An in-process Map as a fallback for `next dev`, `next build`, and any
 *     runtime without the binding. It is per-instance and therefore only a
 *     best-effort backstop, not a security boundary.
 *
 * The in-process map is size-capped so that an attacker rotating keys cannot
 * grow it without bound.
 */

export type RateLimitResult = { allowed: boolean; remaining: number; limit: number }

type Bucket = { count: number; resetAt: number }

const MAX_TRACKED_KEYS = 10_000
const CLEANUP_INTERVAL = 60_000

const buckets = new Map<string, Bucket>()
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key)
  }
  // Hard cap: if the map is still large after expiry sweeps, the keys are live
  // and new ones are arriving faster than they expire. Evict the oldest
  // insertion so memory stays bounded.
  if (buckets.size > MAX_TRACKED_KEYS) {
    const excess = buckets.size - MAX_TRACKED_KEYS
    let dropped = 0
    for (const key of buckets.keys()) {
      buckets.delete(key)
      if (++dropped >= excess) break
    }
  }
}

type WorkersRateLimiter = { limit: (opts: { key: string }) => Promise<{ success: boolean }> }

let workersLimiter: WorkersRateLimiter | null | undefined

/**
 * Resolve the Workers binding once. Wrangler exposes bindings on `env`, which
 * lands on `globalThis` under different names depending on the adapter, so
 * probe the plausible locations rather than hard-coding one.
 */
function getWorkersLimiter(): WorkersRateLimiter | null {
  if (workersLimiter !== undefined) return workersLimiter

  type MaybeEnv = { RATE_LIMITER?: unknown; env?: { RATE_LIMITER?: unknown }; __env?: { RATE_LIMITER?: unknown } }

  const scopes: MaybeEnv[] = [
    globalThis as unknown as MaybeEnv,
    (globalThis as MaybeEnv).env ?? {},
    (globalThis as MaybeEnv).__env ?? {},
    (typeof process !== "undefined" ? (process.env as unknown as MaybeEnv) : {}) ?? {},
  ]

  for (const scope of scopes) {
    const candidate = scope.RATE_LIMITER ?? scope.env?.RATE_LIMITER ?? scope.__env?.RATE_LIMITER
    if (candidate && typeof (candidate as WorkersRateLimiter).limit === "function") {
      workersLimiter = candidate as WorkersRateLimiter
      return workersLimiter
    }
  }

  workersLimiter = null
  return null
}

export async function rateLimit(
  key: string,
  opts: { windowMs: number; max: number },
): Promise<RateLimitResult> {
  const limiter = getWorkersLimiter()
  if (limiter) {
    try {
      const { success } = await limiter.limit({ key })
      return { allowed: success, remaining: success ? opts.max - 1 : 0, limit: opts.max }
    } catch {
      // Binding rejected the call (not deployed, misconfigured, or a binding
      // that is only available on some requests). Fall through to the
      // in-process limiter so a failure here cannot silently disable all
      // throttling.
    }
  }

  cleanup()

  const now = Date.now()
  const existing = buckets.get(key)

  if (!existing || now > existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs })
    return { allowed: true, remaining: opts.max - 1, limit: opts.max }
  }

  existing.count += 1
  if (existing.count > opts.max) {
    return { allowed: false, remaining: 0, limit: opts.max }
  }
  return { allowed: true, remaining: opts.max - existing.count, limit: opts.max }
}

/**
 * Best-effort client address. `x-forwarded-for` is client-controlled in general,
 * so this is a rate-limit *bucket* key, never an authorization or audit
 * identity. On Cloudflare `cf-connecting-ip` is set by the edge and cannot be
 * spoofed by the client, so prefer it when present.
 */
export function clientIp(req: Request): string {
  const cf = req.headers.get("cf-connecting-ip")
  if (cf) return cf.trim()

  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim()
    if (first) return first
  }

  return req.headers.get("x-real-ip")?.trim() || "unknown"
}
