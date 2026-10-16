export interface HistoryEntry {
  id: number
  type: "movie" | "tv"
  title: string
  poster_path: string | null
  backdrop_path: string | null
  vote_average: number
  release_date?: string | null
  season?: number
  episode?: number
  provider?: string
  lastWatchedAt: string
}

export interface Progress {
  currentTime: number
  duration: number
  percent: number
  completed: boolean
  season?: number
  episode?: number
  provider?: string
  lastUpdated: string
}

const HISTORY_KEY = "movieo:history"
const PROGRESS_KEY = "movieo:progress"
const PURGE_KEY = "movieo:purged"
const MAX_HISTORY = 50

function read<T>(key: string, fallback: T, validate: (value: unknown) => value is T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed: unknown = JSON.parse(raw)
    // localStorage is user-editable, so never trust the shape: a stale or
    // hand-edited value must not reach callers as a half-typed object.
    return validate(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (!value || typeof value !== "object") return false
  const e = value as Record<string, unknown>
  return (
    typeof e.id === "number" &&
    (e.type === "movie" || e.type === "tv") &&
    typeof e.title === "string" &&
    typeof e.lastWatchedAt === "string"
  )
}

function isHistory(value: unknown): value is HistoryEntry[] {
  return Array.isArray(value) && value.every(isHistoryEntry)
}

function isProgress(value: unknown): value is Progress {
  if (!value || typeof value !== "object") return false
  const p = value as Record<string, unknown>
  return (
    typeof p.currentTime === "number" &&
    typeof p.duration === "number" &&
    typeof p.percent === "number" &&
    typeof p.completed === "boolean"
  )
}

function isProgressMap(value: unknown): value is Record<string, Progress> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  return Object.values(value as Record<string, unknown>).every(isProgress)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((s) => typeof s === "string")
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

export function addHistory(entry: Omit<HistoryEntry, "lastWatchedAt">) {
  const items = read<HistoryEntry[]>(HISTORY_KEY, [], isHistory)
  const next = [{ ...entry, lastWatchedAt: new Date().toISOString() }, ...items.filter((i) => !(i.id === entry.id && i.type === entry.type))]
  write(HISTORY_KEY, next.slice(0, MAX_HISTORY))
}

export function getHistory(): HistoryEntry[] {
  return read<HistoryEntry[]>(HISTORY_KEY, [], isHistory)
}

export function clearHistory() {
  write(HISTORY_KEY, [])
}

export function setHistory(entries: HistoryEntry[]) {
  write(HISTORY_KEY, entries.slice(0, MAX_HISTORY))
}

export function parseHistoryImport(text: string): HistoryEntry[] | null {
  try {
    const parsed: unknown = JSON.parse(text)
    if (!Array.isArray(parsed)) return null
    // Must match `isHistoryEntry` exactly: `setHistory` stores this array and
    // `getHistory` re-validates on read, so a loosely-typed import would be
    // silently dropped the next time history is loaded.
    if (!parsed.every(isHistoryEntry)) return null
    return parsed
  } catch {
    return null
  }
}

export function removeFromHistory(id: number, type: "movie" | "tv") {
  const items = read<HistoryEntry[]>(HISTORY_KEY, [], isHistory)
  write(
    HISTORY_KEY,
    items.filter((i) => !(i.id === id && i.type === type)),
  )
}

export function removeProgressFor(id: number, type: "movie" | "tv") {
  const all = read<Record<string, Progress>>(PROGRESS_KEY, {}, isProgressMap)
  const prefix = `${type}:${id}`
  const next: Record<string, Progress> = {}
  for (const key of Object.keys(all)) {
    if (key === prefix || key.startsWith(`${prefix}:`)) continue
    next[key] = all[key]
  }
  write(PROGRESS_KEY, next)
}

const purgeTag = (id: number, type: "movie" | "tv") => `${type}:${id}`

export function isProgressPurged(id: number, type: "movie" | "tv"): boolean {
  return read<string[]>(PURGE_KEY, [], isStringArray).includes(purgeTag(id, type))
}

export function markProgressPurged(id: number, type: "movie" | "tv") {
  const items = read<string[]>(PURGE_KEY, [], isStringArray)
  const tag = purgeTag(id, type)
  if (!items.includes(tag)) write(PURGE_KEY, [...items, tag])
}

export function clearProgressPurge(id: number, type: "movie" | "tv") {
  const tag = purgeTag(id, type)
  write(
    PURGE_KEY,
    read<string[]>(PURGE_KEY, [], isStringArray).filter((t) => t !== tag),
  )
}

export function clearAllPurges() {
  write(PURGE_KEY, [])
}

export function clearProgress() {
  write(PROGRESS_KEY, {})
}

function progressKey(id: number, type: "movie" | "tv", season?: number, episode?: number) {
  if (type === "tv" && season != null && episode != null) return `${type}:${id}:s${season}e${episode}`
  return `${type}:${id}`
}

export function getProgress(id: number, type: "movie" | "tv", season?: number, episode?: number): Progress | undefined {
  const all = read<Record<string, Progress>>(PROGRESS_KEY, {}, isProgressMap)
  return all[progressKey(id, type, season, episode)]
}

export function updateProgress(
  id: number,
  type: "movie" | "tv",
  patch: Omit<Partial<Progress>, "lastUpdated"> & { currentTime: number; duration: number },
) {
  const all = read<Record<string, Progress>>(PROGRESS_KEY, {}, isProgressMap)
  const key = progressKey(id, type, patch.season, patch.episode)
  const prev = all[key] || { currentTime: 0, duration: 0, percent: 0, completed: false }
  const percent = patch.duration > 0 ? Math.min((patch.currentTime / patch.duration) * 100, 100) : prev.percent
  all[key] = {
    ...prev,
    ...patch,
    percent,
    completed: percent >= 90,
    lastUpdated: new Date().toISOString(),
  }
  write(PROGRESS_KEY, all)
}

export function getAllProgress(): Record<string, Progress> {
  return read<Record<string, Progress>>(PROGRESS_KEY, {}, isProgressMap)
}

export function formatTime(seconds: number): string {
  if (!seconds || seconds <= 0) return "0:00"
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  return `${m}:${String(s).padStart(2, "0")}`
}

export function timeAgo(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime())
  const s = Math.floor(diff / 1000)
  if (s < 60) return "just now"
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d`
  const w = Math.floor(d / 7)
  if (w < 4) return `${w}w`
  const mo = Math.floor(d / 30)
  if (mo < 12) return `${mo}mo`
  return `${Math.floor(d / 365)}y`
}

export function progressPercent(p: Progress | undefined): number | null {
  if (!p || p.duration <= 0) return null
  return Math.round(Math.min(p.percent, 100))
}