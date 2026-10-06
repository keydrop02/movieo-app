const KEY = "movieo:recent-searches"
const MAX = 10

export function getRecentSearches(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((s): s is string => typeof s === "string").slice(0, MAX)
  } catch {
    return []
  }
}

export function addRecentSearch(query: string): void {
  const q = query.trim().toLowerCase()
  if (!q) return
  try {
    const next = [q, ...getRecentSearches().filter((s) => s !== q)]
    window.localStorage.setItem(KEY, JSON.stringify(next.slice(0, MAX)))
  } catch {}
}

export function removeRecentSearch(query: string): void {
  try {
    const next = getRecentSearches().filter((s) => s !== query)
    window.localStorage.setItem(KEY, JSON.stringify(next))
  } catch {}
}

export function clearRecentSearches(): void {
  try {
    window.localStorage.removeItem(KEY)
  } catch {}
}