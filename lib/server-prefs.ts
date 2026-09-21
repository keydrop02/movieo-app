export const SERVER_ORDER_KEY = "movieo:serverOrder"

const SERVER_PREF_PREFIX = "movieo:server:"

export function serverPrefKey(kind: string, id: number): string {
  return `${SERVER_PREF_PREFIX}${kind}:${id}`
}

export function readServerPref(kind: string, id: number): string | null {
  if (typeof window === "undefined") return null
  try {
    const v = window.localStorage.getItem(serverPrefKey(kind, id))
    return typeof v === "string" && v.length > 0 ? v : null
  } catch {
    return null
  }
}

export function writeServerPref(kind: string, id: number, serverId: string): void {
  try {
    window.localStorage.setItem(serverPrefKey(kind, id), serverId)
  } catch {}
}

export function clearServerPref(kind: string, id: number): void {
  try {
    window.localStorage.removeItem(serverPrefKey(kind, id))
  } catch {}
}

export function clearAllServerPrefs(): void {
  try {
    const keys: string[] = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i)
      if (k && k.startsWith(SERVER_PREF_PREFIX)) keys.push(k)
    }
    for (const k of keys) window.localStorage.removeItem(k)
    window.localStorage.removeItem("movieo:server")
  } catch {}
}

export function readServerOrder(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(SERVER_ORDER_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : []
  } catch {
    return []
  }
}

export function writeServerOrder(ids: string[]): void {
  try {
    window.localStorage.setItem(SERVER_ORDER_KEY, JSON.stringify(ids))
  } catch {}
}

export function clearServerOrder(): void {
  try {
    window.localStorage.removeItem(SERVER_ORDER_KEY)
  } catch {}
}

export function orderSources<T extends { id: string }>(items: T[]): T[] {
  const order = readServerOrder()
  if (order.length === 0) return items
  const rank = (id: string) => {
    const i = order.indexOf(id)
    return i < 0 ? order.length + 1 : i
  }
  return items.slice().sort((a, b) => rank(a.id) - rank(b.id))
}