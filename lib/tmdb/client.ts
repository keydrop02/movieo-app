/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only"

import type { Episode, MediaDetail, MediaItem, MediaKind, WatchProvider } from "./types"
import { getEnv } from "@/lib/env"

const BASE = "https://api.themoviedb.org/3"
const CONCURRENCY = 3

let active = 0
const queue: Array<() => void> = []
async function acquire() {
  if (active >= CONCURRENCY) await new Promise<void>((resolve) => queue.push(resolve))
  active++
}
function release() {
  active--
  queue.shift()?.()
}

const CURATED_TO_ENDPOINT: Record<
  string,
  { kind: MediaKind; endpoint: string; sort: string | null; voteCutoff?: number }
> = {
  "oscar-best-picture": { kind: "movie", endpoint: "/movie/top_rated", sort: "vote_count.desc", voteCutoff: 1000 },
  "award-winning-movies": { kind: "movie", endpoint: "/movie/top_rated", sort: "vote_average.desc", voteCutoff: 2000 },
  "award-winning-shows": { kind: "tv", endpoint: "/tv/top_rated", sort: "vote_average.desc", voteCutoff: 300 },
  "top-rated-movies": { kind: "movie", endpoint: "/movie/top_rated", sort: "vote_average.desc", voteCutoff: 1000 },
  "top-rated-series": { kind: "tv", endpoint: "/tv/top_rated", sort: "vote_average.desc", voteCutoff: 500 },
  "rotten-tomatoes-100": { kind: "movie", endpoint: "/movie/top_rated", sort: "vote_average.desc", voteCutoff: 1000 },
  "based-on-true-story": { kind: "movie", endpoint: "/discover/movie", sort: "vote_average.desc", voteCutoff: 100 },
  psychology: { kind: "movie", endpoint: "/discover/movie", sort: "popularity.desc", voteCutoff: 400 },
  "mindfck": { kind: "movie", endpoint: "/discover/movie", sort: "popularity.desc", voteCutoff: 400 },
  halloween: { kind: "movie", endpoint: "/discover/movie", sort: "popularity.desc", voteCutoff: 300 },
  cannes: { kind: "movie", endpoint: "/movie/now_playing", sort: "vote_average.desc", voteCutoff: 100 },
}

export type MovieCategory = "now_playing" | "popular" | "top_rated" | "upcoming"
export type TvCategory = "on_the_air" | "airing_today" | "popular" | "top_rated"

let keyIndex = 0
function nextKey(keys: string[]): string {
  const key = keys[keyIndex % keys.length]
  keyIndex++
  return key
}

async function tmdb<T>(path: string, params: Record<string, string | number | boolean> = {}, init?: RequestInit): Promise<T> {
  await acquire()
  try {
    const { TMDB_API_KEYS } = getEnv()
    const url = new URL(BASE + path)
    url.searchParams.set("api_key", nextKey(TMDB_API_KEYS))
    url.searchParams.set("language", "en-US")
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "" && v !== null) url.searchParams.set(k, String(v))
    }
    let lastErr: unknown
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(url, { next: { revalidate: 3600 }, ...init })
        if (!res.ok) throw new Error(`TMDB ${path} failed: ${res.status}`)
        return (await res.json()) as T
      } catch (err) {
        lastErr = err
        if (attempt < 2) {
          const backoff = 400 * Math.pow(2, attempt)
          await new Promise((r) => setTimeout(r, backoff))
        }
      }
    }
    throw lastErr
  } finally {
    release()
  }
}

function toItem(raw: any, kind: MediaKind): MediaItem {
  return {
    id: raw.id,
    kind,
    title: kind === "movie" ? raw.title : raw.name,
    overview: raw.overview ?? "",
    poster_path: raw.poster_path ?? null,
    backdrop_path: raw.backdrop_path ?? null,
    release_date: kind === "movie" ? raw.release_date ?? null : raw.first_air_date ?? null,
    vote_average: raw.vote_average ?? 0,
    vote_count: raw.vote_count ?? 0,
    popularity: raw.popularity ?? 0,
    genre_ids: raw.genre_ids,
    adult: raw.adult,
  }
}

function list(raw: any, kind: MediaKind): MediaItem[] {
  return (raw.results ?? []).map((r: any) => toItem(r, kind))
}

export async function getCurated(key: string, kind?: MediaKind): Promise<MediaItem[]> {
  const cfg = CURATED_TO_ENDPOINT[key]
  if (!cfg) throw new Error(`Unknown curated list key: ${key}`)
  const useKind = kind ?? cfg.kind
  const endpoint = useKind === "tv" ? (cfg.endpoint === "/movie/top_rated" ? "/tv/top_rated" : cfg.endpoint === "/movie/now_playing" ? "/tv/on_the_air" : cfg.endpoint) : cfg.endpoint

  const raw = await tmdb<any>(endpoint, { page: 1 })
  const items = list(raw, useKind)
    .filter((i) => !cfg.voteCutoff || (i.vote_count ?? 0) >= cfg.voteCutoff)
    .sort((a, b) => (cfg.sort === "vote_average.desc" ? b.vote_average - a.vote_average : b.popularity - a.popularity))
  return items.slice(0, 20)
}

export async function getTrending(kind: MediaKind, window: "week" | "day" = "week"): Promise<MediaItem[]> {
  const raw = await tmdb<any>(`/trending/${kind}/${window}`)
  return list(raw, kind)
}

export interface PersonDetail {
  id: number
  name: string
  profile_path: string | null
  known_for_department: string
  biography: string
  birthday: string | null
  deathday: string | null
  place_of_birth: string | null
  homepage: string | null
  imdb_id: string | null
  twitter_id: string | null
  instagram_id: string | null
  facebook_id: string | null
  known: MediaItem[]
  credits: Array<MediaItem & { role?: string }>
}

export async function getPerson(id: number): Promise<PersonDetail | null> {
  const raw = await tmdb<any>(`/person/${id}`, { append_to_response: "combined_credits,external_ids" })
  if (!raw.id) return null
  const all = [...(raw.combined_credits?.cast ?? []), ...(raw.combined_credits?.crew ?? [])] as any[]
  const seen = new Set<string>()
  const credits: Array<MediaItem & { role?: string }> = all
    .filter((e) => e.media_type === "movie" || e.media_type === "tv")
    .filter((e) => {
      const k = `${e.media_type}-${e.id}`
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
    .map((e) => ({ ...toItem(e, e.media_type === "tv" ? "tv" : "movie"), role: e.character ?? e.job ?? undefined }))
    .sort((a, b) => b.popularity - a.popularity)
  return {
    id: raw.id,
    name: raw.name ?? "Unknown",
    profile_path: raw.profile_path ?? null,
    known_for_department: raw.known_for_department ?? "",
    biography: raw.biography ?? "",
    birthday: raw.birthday ?? null,
    deathday: raw.deathday ?? null,
    place_of_birth: raw.place_of_birth ?? null,
    homepage: raw.homepage ?? null,
    imdb_id: raw.imdb_id ?? null,
    twitter_id: raw.external_ids?.twitter_id ?? null,
    instagram_id: raw.external_ids?.instagram_id ?? null,
    facebook_id: raw.external_ids?.facebook_id ?? null,
    known: credits.slice(0, 18),
    credits,
  }
}

function pickTrailers(videos: any[]): any[] {
  const SPAM = /\b(in cinemas|now playing|shorts?|fancam|countdown|tickets?|book now|happy birthday|sold out|vignette|behind the scenes|trailer livestream|day one|1 ?week|2 ?days|tomorrow|set your alarm)\b/i
  const score = (v: any): number => {
    const n = (v.name ?? "").toLowerCase()
    let s = v.type === "Trailer" ? 100 : v.type === "Teaser" ? 30 : 0
    if (v.site !== "YouTube" || v.official === false) s -= 500
    if (/official|final|first look|exclusive/.test(n)) s += 40
    if (/\btrailer\b/.test(n)) s += 70
    if (/\bteaser\b/.test(n)) s += 30
    if (n.length >= 20) s += 25
    if (n.length >= 40) s += 15
    if (n.length > 0 && n.length < 12) s -= 60
    if (SPAM.test(n)) s -= 90
    return s
  }
  return [...videos]
    .filter((v) => v.type === "Trailer" || v.type === "Teaser")
    .sort((a, b) => score(b) - score(a))
    .slice(0, 6)
}

function pickTitleLogo(images?: { logos?: Array<{ iso_639_1?: string | null; width?: number; aspect_ratio?: number; file_path?: string }> }) {
  const logos = [...(images?.logos ?? [])]
    .filter((l) => l.iso_639_1 === "en")
    .sort((a, b) => (b.width ?? 0) - (a.width ?? 0) || (b.aspect_ratio ?? 0) - (a.aspect_ratio ?? 0))
  return logos[0]?.file_path ?? null
}

export async function getTitleLogos(items: Array<{ id: number; kind: MediaKind }>): Promise<Record<number, string | null>> {
  const res = await Promise.all(
    items.map(async ({ id, kind }) => {
      try {
        const { images } = await tmdb<{ images?: { logos?: Array<Record<string, any>> } }>(`/${kind}/${id}`, {
          append_to_response: "images",
        })
        return [id, pickTitleLogo(images)] as const
      } catch {
        return [id, null] as const
      }
    }),
  )
  return Object.fromEntries(res)
}

export async function getMovieCategory(category: MovieCategory): Promise<MediaItem[]> {
  const raw = await tmdb<any>(`/movie/${category}`, { page: 1 })
  return list(raw, "movie")
}

export async function getTvCategory(category: TvCategory): Promise<MediaItem[]> {
  const raw = await tmdb<any>(`/tv/${category}`, { page: 1 })
  return list(raw, "tv")
}

export async function searchAll(query: string): Promise<MediaItem[]> {
  if (!query.trim()) return []
  const raw = await tmdb<any>("/search/multi", { query, include_adult: "false" })
  return (raw.results ?? [])
    .filter((r: any) => r.media_type === "movie" || r.media_type === "tv")
    .slice(0, 20)
    .map((r: any) => toItem(r, r.media_type))
}

export async function getGenres(kind: MediaKind): Promise<Array<{ id: number; name: string }>> {
  const raw = await tmdb<any>(`/genre/${kind}/list`)
  return raw.genres ?? []
}

const PROVIDER_ORDER = [
  "Netflix",
  "Amazon Prime Video",
  "Disney+",
  "Apple TV+",
  "Hulu",
  "HBO Max",
  "YouTube",
  "Peacock",
  "Paramount+",
  "Crunchyroll",
  "Tubi TV",
  "The Roku Channel",
  "Pluto TV",
  "Starz",
  "AMC+",
  "fuboTV",
  "YouTube TV",
  "MGM+",
  "Discovery+",
  "ESPN+",
  "PBS",
  "Kanopy",
  "Plex",
  "Sling TV",
  "BritBox",
  "Acorn TV",
  "MUBI",
  "Shudder",
  "Rakuten Viki",
  "VIX",
]

const normalizeName = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "")

export async function getProvidersList(): Promise<WatchProvider[]> {
  const raw = await tmdb<any>("/watch/providers/movie")
  const all: WatchProvider[] = (raw.results ?? [])
    .filter((p: any) => p.display_priorities?.US !== undefined)
    .map((p: any) => ({ id: p.provider_id, name: p.provider_name, logo_path: p.logo_path }))
  const indexOf = new Map(all.map((p) => [normalizeName(p.name), p] as const))
  return PROVIDER_ORDER.map((name) => indexOf.get(normalizeName(name))).filter((p): p is WatchProvider => Boolean(p))
}

const COUNTRY_CODES: Record<string, { origin: string; lang: string }> = {
  "United States": { origin: "US", lang: "en" },
  "United Kingdom": { origin: "GB", lang: "en" },
  Japan: { origin: "JP", lang: "ja" },
  "South Korea": { origin: "KR", lang: "ko" },
  India: { origin: "IN", lang: "hi" },
  France: { origin: "FR", lang: "fr" },
  Spain: { origin: "ES", lang: "es" },
  Germany: { origin: "DE", lang: "de" },
  Italy: { origin: "IT", lang: "it" },
  Canada: { origin: "CA", lang: "en" },
  Australia: { origin: "AU", lang: "en" },
  China: { origin: "CN", lang: "zh" },
  "Hong Kong": { origin: "HK", lang: "zh" },
  Taiwan: { origin: "TW", lang: "zh" },
  Mexico: { origin: "MX", lang: "es" },
  Brazil: { origin: "BR", lang: "pt" },
  Argentina: { origin: "AR", lang: "es" },
  Turkey: { origin: "TR", lang: "tr" },
  Russia: { origin: "RU", lang: "ru" },
  Sweden: { origin: "SE", lang: "sv" },
  Denmark: { origin: "DK", lang: "da" },
  Norway: { origin: "NO", lang: "no" },
  Netherlands: { origin: "NL", lang: "nl" },
  Belgium: { origin: "BE", lang: "nl" },
  Ireland: { origin: "IE", lang: "en" },
  Poland: { origin: "PL", lang: "pl" },
  Thailand: { origin: "TH", lang: "th" },
  Philippines: { origin: "PH", lang: "fil" },
  Indonesia: { origin: "ID", lang: "id" },
  "New Zealand": { origin: "NZ", lang: "en" },
  "South Africa": { origin: "ZA", lang: "en" },
}

export interface DiscoverParams {
  genre?: number | string
  year?: number | string
  voteMin?: number
  minVotes?: number
  provider?: number | string
  sort?: string
  country?: string
  page?: number
}

const SORT_MAP: Record<string, string> = {
  popular: "popularity.desc",
  rating: "vote_average.desc",
  voted: "vote_count.desc",
  newest: "primary_release_date.desc",
  oldest: "primary_release_date.asc",
  "title-az": "original_title.asc",
}

export async function discover(kind: MediaKind, params: DiscoverParams = {}): Promise<{ items: MediaItem[]; page: number; totalPages: number }> {
  const qp: Record<string, string | number> = {}
  if (params.genre) qp.with_genres = params.genre
  if (params.year) qp[kind === "tv" ? "first_air_date_year" : "primary_release_year"] = params.year
  const cc = params.country ? COUNTRY_CODES[params.country] : undefined
  if (params.provider) {
    qp.with_watch_providers = params.provider
    qp.watch_region = cc?.origin ?? "US"
  }
  if (cc && kind === "tv") qp.with_origin_country = cc.origin
  if (cc && kind === "movie") qp.with_original_language = cc.lang
  let sortBy = params.sort ? (SORT_MAP[params.sort] ?? params.sort) : "popularity.desc"
  if (kind === "tv") sortBy = sortBy.replace("primary_release_date", "first_air_date")
  qp.sort_by = sortBy
  if (params.sort === "newest") {
    const today = new Date().toISOString().slice(0, 10)
    qp[kind === "tv" ? "first_air_date.lte" : "primary_release_date.lte"] = today
  }
  if (params.voteMin) qp["vote_average.gte"] = params.voteMin
  const minVotes = params.minVotes ?? (params.sort === "rating" ? 300 : 100)
  if (minVotes) qp["vote_count.gte"] = minVotes
  qp.page = params.page ?? 1
  const raw = await tmdb<any>(`/discover/${kind}`, qp)
  return { items: list(raw, kind), page: raw.page, totalPages: raw.total_pages }
}

export async function getMoviesOnProvider(providerId: number, kind: MediaKind): Promise<MediaItem[]> {
  const raw = await tmdb<any>(`/discover/${kind}`, {
    with_watch_providers: providerId,
    watch_region: "US",
    sort_by: "popularity.desc",
    page: 1,
  })
  return list(raw, kind)
}

export async function getDetail(kind: MediaKind, id: number): Promise<MediaDetail> {
  const raw = await tmdb<any>(`/${kind}/${id}`, {
    append_to_response: "credits,videos,similar,images,recommendations,release_dates,content_ratings,watch/providers",
  })
  const base = toItem(raw, kind)
  const cert =
    kind === "movie"
      ? (raw.release_dates?.results?.find((r: any) => r.iso_3166_1 === "US")?.release_dates ?? []).find((d: any) => d.certification)?.certification ?? null
      : raw.content_ratings?.results?.find((r: any) => r.iso_3166_1 === "US")?.rating ?? null

  const providersRaw = raw["watch/providers"]?.results?.US
  const buckets = ["flatrate", "rent", "buy"]
  const providers = buckets.flatMap((bt) =>
    (providersRaw?.[bt] ?? []).map((p: any) => ({
      provider_id: p.provider_id,
      provider_name: p.provider_name,
      logo_path: p.logo_path,
      display_priority: p.display_priority ?? 99,
      item_type: bt,
    })),
  )

  const cast: any[] = raw.credits?.cast ?? []
  const crew: any[] = raw.credits?.crew ?? []
  const directors = crew.filter((c) => c.job === "Director").map((c) => ({
    id: c.id,
    name: c.name,
    profile_path: c.profile_path ?? null,
    job: c.job,
  }))
  const creators = raw.created_by?.map((c: any) => ({ id: c.id, name: c.name, profile_path: c.profile_path ?? null, job: "Creator" })) ?? []

  const seasons: any[] | undefined = kind === "tv" ? (raw.seasons ?? []).filter((s: any) => s.season_number > 0) : undefined

  const detail = {
    ...base,
    tagline: raw.tagline ?? "",
    status: raw.status ?? "",
    original_language: raw.original_language ?? raw.original_country?.[0] ?? "en",
    genres: raw.genres ?? [],
    runtime: kind === "movie" ? raw.runtime ?? null : null,
    certification: cert,
    directors,
    creators,
    cast: cast
      .slice(0, 18)
      .map((c) => ({ id: c.id, name: c.name, profile_path: c.profile_path ?? null, character: c.character, order: c.order })),
    videos: pickTrailers(raw.videos?.results ?? []),
    similar: list({ results: raw.similar?.results ?? raw.recommendations?.results ?? [] }, kind),
    providers,
    title_logo: pickTitleLogo(raw.images),
    collection: raw.belongs_to_collection
      ? { id: raw.belongs_to_collection.id, name: raw.belongs_to_collection.name, backdrop_path: raw.belongs_to_collection.backdrop_path, poster_path: raw.belongs_to_collection.poster_path, parts: [] as MediaItem[] }
      : null,
    seasons,
    number_of_seasons: kind === "tv" ? raw.number_of_seasons : undefined,
    number_of_episodes: kind === "tv" ? raw.number_of_episodes : undefined,
    original_languages: raw.spoken_languages?.map((l: any) => l.name) ?? [],
    homepage: raw.homepage || null,
    budget: raw.budget,
    revenue: raw.revenue,
  }

  if (detail.collection) {
    try {
      const colRaw = await tmdb<any>(`/collection/${detail.collection.id}`)
      detail.collection.parts = list({ results: colRaw.parts ?? [] }, "movie")
    } catch {}
  }

  return detail
}

export async function getEpisodes(id: number, seasonNumber: number): Promise<Episode[]> {
  const raw = await tmdb<any>(`/tv/${id}/season/${seasonNumber}`)
  return (raw.episodes ?? []).map((e: any) => ({
    id: e.id,
    name: e.name,
    season_number: e.season_number,
    episode_number: e.episode_number,
    overview: e.overview ?? "",
    air_date: e.air_date ?? null,
    runtime: e.runtime ?? null,
    still_path: e.still_path ?? null,
    vote_average: e.vote_average ?? 0,
    vote_count: e.vote_count ?? 0,
  }))
}

export async function getProviderDetail(id: number): Promise<{ id: number; name: string; logo_path: string | null } | null> {
  const providers = await getProvidersList()
  return providers.find((p) => p.id === id) ?? null
}