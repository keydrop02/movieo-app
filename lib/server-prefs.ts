export const SERVER_ORDER_KEY = "movieo:serverOrder"

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