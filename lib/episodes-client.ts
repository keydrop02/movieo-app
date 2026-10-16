"use client"

import type { Episode } from "@/lib/tmdb/types"

/**
 * Fetch a season's episodes from our own `/api/episodes` endpoint.
 *
 * Centralises the `res.ok` check and error reporting that the watch player and
 * download modal previously each did in their own way (one of them silently
 * rendered a failed request as "No episodes available"). Returns an empty array
 * for an empty season, and throws on a genuine failure so callers can show a
 * distinct message.
 */
export async function fetchEpisodes(id: number, season: number, signal?: AbortSignal): Promise<Episode[]> {
  const res = await fetch(`/api/episodes/${id}/${season}`, { signal })
  if (!res.ok) throw new Error(`episodes ${res.status}`)
  const data = (await res.json()) as { episodes?: unknown }
  return Array.isArray(data.episodes) ? (data.episodes as Episode[]) : []
}
