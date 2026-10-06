import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { GridWithFetch } from "@/components/grid-pages"
import { PosterRow } from "@/components/rows"
import { discover, getTrending } from "@/lib/tmdb/client"
import type { MediaItem } from "@/lib/tmdb/types"

const CATEGORY_MAP: Record<
  string,
  { title: string; kind: "movie" | "tv"; slug: string; label: string; sort: string; trending?: boolean }
> = {
  "movie/trending": { title: "Trending Movies", kind: "movie", slug: "trending", label: "Trending Movies", sort: "popular", trending: true },
  "movie/top_rated": { title: "Top Rated Movies", kind: "movie", slug: "top_rated", label: "Top Rated Movies", sort: "rating" },
  "movie/popular": { title: "Popular Movies", kind: "movie", slug: "popular", label: "Popular Movies", sort: "popular" },
  "movie/now_playing": { title: "Now Playing Movies", kind: "movie", slug: "now_playing", label: "Now Playing Movies", sort: "popular" },
  "movie/upcoming": { title: "Upcoming Movies", kind: "movie", slug: "upcoming", label: "Upcoming Movies", sort: "newest" },
  "tv/trending": { title: "Trending Series", kind: "tv", slug: "trending", label: "Trending Series", sort: "popular", trending: true },
  "tv/top_rated": { title: "Top Rated Series", kind: "tv", slug: "top_rated", label: "Top Rated Series", sort: "rating" },
  "tv/popular": { title: "Popular Series", kind: "tv", slug: "popular", label: "Popular Series", sort: "popular" },
  "tv/on_the_air": { title: "On The Air Series", kind: "tv", slug: "on_the_air", label: "On The Air Series", sort: "popular" },
  "tv/airing_today": { title: "Airing Today Series", kind: "tv", slug: "airing_today", label: "Airing Today Series", sort: "newest" },
}

type Params = { params: Promise<{ type: string; slug: string }> }

export async function generateStaticParams() {
  return Object.keys(CATEGORY_MAP).map((key) => {
    const [type, slug] = key.split("/")
    return { type, slug }
  })
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { type, slug } = await params
  const cfg = CATEGORY_MAP[`${type}/${slug}`]
  if (!cfg) return { title: "Category" }
  return {
    title: cfg.label,
    description: `Browse ${cfg.title.toLowerCase()} on Movieo.`,
    alternates: { canonical: `/category/${type}/${slug}` },
  }
}

export default async function CategoryPage({ params }: Params) {
  const { type, slug } = await params
  const cfg = CATEGORY_MAP[`${type}/${slug}`]
  if (!cfg) notFound()

  // Trending is a distinct TMDB endpoint that reports a ranked window rather
  // than a page of discover results. This page previously routed trending
  // through `discover` with a popularity sort, so the "Trending" heading was
  // really showing "Popular".
  if (cfg.trending) {
    const items = await getTrending(cfg.kind).catch(() => [])
    return (
      <div className="relative z-10 pt-24 pb-20 px-6 lg:px-16">
        <div className="mx-auto max-w-[1600px]">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-8 drop-shadow-lg">
            {cfg.title}
          </h1>
          {items.length > 0 ? (
            <PosterRow items={items} mask={false} padClass="px-2" minH="min-h-[240px] sm:min-h-[310px] lg:min-h-[384px]" />
          ) : (
            <p className="text-sm text-white/60">Trending titles are unavailable right now.</p>
          )}
        </div>
      </div>
    )
  }

  // Without this guard a TMDB outage during prerender aborted the whole build
  // (`Export encountered an error on /category/[type]/[slug]/page`), turning a
  // transient network failure into a failed deploy. The page renders with an
  // empty grid and the client's pagination can recover.
  const disc = await discover(cfg.kind, { sort: cfg.sort as "rating" | "popular" | "newest" }).catch(() => ({
    items: [] as MediaItem[],
    page: 1,
    totalPages: 1,
  }))

  return (
    <div className="relative z-10 pt-24 pb-20 px-6 lg:px-16">
      <div className="mx-auto max-w-[1600px]">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-8 drop-shadow-lg">
          {cfg.title}
        </h1>
        {disc.items.length > 0 ? (
          <div>
            <GridWithFetch
              query={`kind=${cfg.kind}&sort=${cfg.sort}`}
              initialItems={disc.items}
              initialTotalPages={disc.totalPages}
            />
          </div>
        ) : (
          <p className="text-sm text-white/60">{cfg.title} are unavailable right now. Please try again shortly.</p>
        )}
      </div>
    </div>
  )
}
