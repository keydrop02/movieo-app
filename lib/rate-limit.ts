const hits = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(
  key: string,
  opts: { windowMs: number; max: number } = { windowMs: 60_000, max: 10 },
): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = hits.get(key)

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + opts.windowMs })
    return { allowed: true, remaining: opts.max - 1 }
  }

  entry.count++
  if (entry.count > opts.max) {
    return { allowed: false, remaining: 0 }
  }
  return { allowed: true, remaining: opts.max - entry.count }
}

const CLEANUP_INTERVAL = 5 * 60_000
let lastCleanup = Date.now()

export function cleanupRateLimit() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, entry] of hits) {
    if (now > entry.resetAt) hits.delete(key)
  }
}
