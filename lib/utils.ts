import type { MediaItem } from "./tmdb/types"

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ")
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "")
}

export function mediaUrl(item: Pick<MediaItem, "id" | "kind" | "title" | "release_date">): string {
  const year = ((item.release_date ?? "") as string).slice(0, 4) || ""
  const base = item.kind === "movie" ? "/movie" : "/series"
  const end = year ? `-${year}` : ""
  return `${base}/${item.id}-${slugify(item.title)}${end}`
}

export function year(date: string | null | undefined): string {
  if (!date) return ""
  return date.slice(0, 4)
}

export function formatMoney(n: number | null | undefined): string {
  if (!n) return "—"
  return "$" + n.toLocaleString("en-US")
}

export function formatRuntimeLong(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

export function endsAtTime(startMinutes: number, runtime: number | null): string {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, startMinutes)
  let end = start.getTime() + (runtime ?? 0) * 60_000
  while (end < now.getTime()) end += 24 * 60 * 60_000
  return new Date(end).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toUpperCase().replace(" ", " ")
}

export function rateColor(value: number): string {
  if (value >= 7) return "#4ade80"
  if (value >= 5) return "#facc15"
  return "#f87171"
}