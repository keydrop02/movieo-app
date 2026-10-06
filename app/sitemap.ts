import type { MetadataRoute } from "next"
import { getMovieCategory, getTrending, getTvCategory } from "@/lib/tmdb/client"
import { site } from "@/lib/site"
import { mediaUrl } from "@/lib/utils"

/**
 * Home plus the primary destinations. Everything else is reachable by link.
 *
 * `/watch-history` is deliberately absent: it is rendered from the visitor's own
 * localStorage, so the page we would hand a crawler is always empty, and
 * `app/robots.ts` already disallows it. Listing a URL in the sitemap while
 * disallowing it in robots is contradictory, and a sitemap is a request to index.
 */
const STATIC_PATHS = [
  { path: "/", priority: 1, changeFrequency: "hourly" as const },
  { path: "/movies", priority: 0.9, changeFrequency: "hourly" as const },
  { path: "/series", priority: 0.9, changeFrequency: "hourly" as const },
  { path: "/lists", priority: 0.4, changeFrequency: "monthly" as const },
  { path: "/search", priority: 0.6, changeFrequency: "daily" as const },
]

/**
 * Detail URLs discovered from a handful of editorial rails.
 *
 * This is a deliberate sample rather than an exhaustive dump: TMDB exposes tens
 * of thousands of titles, and enumerating all of them would produce a sitemap
 * dominated by long-tail pages while adding real request cost on every build.
 */
async function sampleTitles() {
  const [trendingMovies, trendingShows, topMovies, popularShows] = await Promise.all([
    getTrending("movie").catch(() => []),
    getTrending("tv").catch(() => []),
    getMovieCategory("top_rated").catch(() => []),
    getTvCategory("popular").catch(() => []),
  ])

  const seen = new Set<string>()
  const urls: Array<{ url: string; lastModified: Date; changeFrequency: "weekly" }> = []

  const add = (item: { id: number; kind: "movie" | "tv"; title: string; release_date: string | null }) => {
    const path = mediaUrl(item)
    if (seen.has(path)) return
    seen.add(path)
    urls.push({
      url: path,
      // TMDB has no per-title updated timestamp in the list payloads, so this is
      // a coarse but honest signal rather than a fabricated date.
      lastModified: new Date(),
      changeFrequency: "weekly",
    })
  }

  for (const item of [...trendingMovies.slice(0, 60), ...trendingShows.slice(0, 60)]) add(item)
  for (const item of [...topMovies.slice(0, 60), ...popularShows.slice(0, 60)]) add(item)

  return urls
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((entry) => ({
    url: `${site.url}${entry.path}`,
    lastModified: now,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }))

  // A sitemap failure must not 500 the route; the static entries are still valid.
  const detailEntries = await sampleTitles().catch(() => [])

  return [
    ...staticEntries,
    ...detailEntries.map((entry) => ({
      url: `${site.url}${entry.url}`,
      lastModified: entry.lastModified,
      changeFrequency: entry.changeFrequency,
      priority: 0.7,
    })),
  ]
}
