import type { MediaItem } from "@/lib/tmdb/types"

export type StoredList = {
  id: string
  name: string
  items: MediaItem[]
  createdAt: number
}

const KEY = "cineflick.lists"
const listeners = new Set<() => void>()

export function itemKey(item: { id: number; kind: string }): string {
  return `${item.kind}:${item.id}`
}

export function readLists(): StoredList[] {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((l): l is StoredList => !!l && typeof l === "object" && typeof (l as StoredList).id === "string")
  } catch {
    return []
  }
}

export function writeLists(lists: StoredList[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(lists))
  } catch {}
  emit()
}

export function emit(): void {
  for (const fn of listeners) {
    try {
      fn()
    } catch {}
  }
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function createList(name: string, id = `list-${Date.now().toString(36)}`): StoredList | null {
  const clean = name.trim()
  if (!clean) return null
  const list: StoredList = { id, name: clean, items: [], createdAt: Date.now() }
  writeLists([...readLists(), list])
  return list
}

export function deleteList(id: string): void {
  writeLists(readLists().filter((l) => l.id !== id))
}

export function renameList(id: string, name: string): void {
  const clean = name.trim()
  if (!clean) return
  writeLists(readLists().map((l) => (l.id === id ? { ...l, name: clean } : l)))
}

export function addToList(id: string, item: MediaItem): void {
  const lists = readLists()
  const list = lists.find((l) => l.id === id)
  if (!list || list.items.some((i) => itemKey(i) === itemKey(item))) return
  writeLists(lists.map((l) => (l.id === id ? { ...l, items: [...l.items, item] } : l)))
}

export function removeFromList(id: string, item: MediaItem): void {
  const lists = readLists()
  writeLists(lists.map((l) => (l.id === id ? { ...l, items: l.items.filter((i) => itemKey(i) !== itemKey(item)) } : l)))
}

export function toggleInList(id: string, item: MediaItem): boolean {
  const lists = readLists()
  const list = lists.find((l) => l.id === id)
  if (!list) return false
  const has = list.items.some((i) => itemKey(i) === itemKey(item))
  writeLists(
    lists.map((l) =>
      l.id === id
        ? { ...l, items: has ? l.items.filter((i) => itemKey(i) !== itemKey(item)) : [...l.items, item] }
        : l,
    ),
  )
  return !has
}

export function isInList(id: string, item: MediaItem): boolean {
  const list = readLists().find((l) => l.id === id)
  return !!list && list.items.some((i) => itemKey(i) === itemKey(item))
}

export type ListFile = {
  app: "cineflick"
  type: "lists"
  version: 1
  exportedAt: string
  lists: StoredList[]
}

export function serializeListFile(lists: StoredList[]): string {
  const file: ListFile = {
    app: "cineflick",
    type: "lists",
    version: 1,
    exportedAt: new Date().toISOString(),
    lists,
  }
  return JSON.stringify(file, null, 2)
}

export function parseListImport(text: string): StoredList[] | null {
  try {
    const parsed: unknown = JSON.parse(text)
    if (!parsed || typeof parsed !== "object") return null
    const f = parsed as Partial<ListFile>
    if (f.app !== "cineflick" || f.type !== "lists" || f.version !== 1 || !Array.isArray(f.lists)) return null
    if (
      !f.lists.every(
        (l) =>
          l &&
          typeof l.id === "string" &&
          typeof l.name === "string" &&
          Array.isArray(l.items) &&
          l.items.every((it) => it && typeof it.id === "number" && (it.kind === "movie" || it.kind === "tv") && typeof it.title === "string"),
      )
    )
      return null
    return f.lists as StoredList[]
  } catch {
    return null
  }
}