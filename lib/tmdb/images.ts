import type { MediaItem } from "./types"

export function img(path: string | null, size = "w500"): string | null {
  if (!path) return null
  return `https://image.tmdb.org/t/p/${size}${path}`
}

export function poster(item: MediaItem, size = "w500"): string | null {
  return img(item.poster_path, size)
}

export function backdrop(item: MediaItem, size = "w780"): string | null {
  return img(item.backdrop_path, size)
}