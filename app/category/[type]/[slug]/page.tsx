import { notFound } from "next/navigation"
import { GridWithFetch } from "@/components/grid-pages"
import { discover } from "@/lib/tmdb/client"

const CATEGORY_MAP: Record<string, { title: string; kind: "movie" | "tv"; slug: string; label: string }> = {
  "movie/trending": { title: "Trending Movies", kind: "movie", slug: "trending", label: "Trending Movies" },
  "movie/top_rated": { title: "Top Rated Movies", kind: "movie", slug: "top_rated", label: "Top Rated Movies" },
  "movie/popular": { title: "Popular Movies", kind: "movie", slug: "popular", label: "Popular Movies" },
  "movie/now_playing": { title: "Now Playing Movies", kind: "movie", slug: "now_playing", label: "Now Playing Movies" },
  "movie/upcoming": { title: "Upcoming Movies", kind: "movie", slug: "upcoming", label: "Upcoming Movies" },
  "tv/trending": { title: "Trending Series", kind: "tv", slug: "trending", label: "Trending Series" },
  "tv/top_rated": { title: "Top Rated Series", kind: "tv", slug: "top_rated", label: "Top Rated Series" },
  "tv/popular": { title: "Popular Series", kind: "tv", slug: "popular", label: "Popular Series" },
  "tv/on_the_air": { title: "On The Air Series", kind: "tv", slug: "on_the_air", label: "On The Air Series" },
  "tv/airing_today": { title: "Airing Today Series", kind: "tv", slug: "airing_today", label: "Airing Today Series" },
}

export async function generateStaticParams() {
  return Object.keys(CATEGORY_MAP).map((key) => {
    const [type, slug] = key.split("/")
    return { type, slug }
  })
}

export async function generateMetadata({ params }: { params: Promise<{ type: string; slug: string }> }) {
  const { type, slug } = await params
  const cfg = CATEGORY_MAP[`${type}/${slug}`]
  return { title: (cfg?.label ?? "Category") }
}

export default async function CategoryPage({ params }: { params: Promise<{ type: string; slug: string }> }) {
  const { type, slug } = await params
  const cfg = CATEGORY_MAP[`${type}/${slug}`]
  if (!cfg) notFound()

  const disc =
    cfg.kind === "movie" ? await discover("movie", { sort: cfg.slug === "top_rated" ? "rating" : "popular" }) : await discover("tv", { sort: cfg.slug === "top_rated" ? "rating" : "popular" })

  return (
    <div className="relative z-10 pt-24 pb-20 px-6 lg:px-16">
      <div className="mx-auto max-w-[1600px]">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-8 drop-shadow-lg">
          {cfg.title}
        </h1>
        <div>
          <GridWithFetch
            query={`kind=${cfg.kind}&sort=${cfg.slug === "top_rated" ? "rating" : "popular"}`}
            initialItems={disc.items}
            initialTotalPages={disc.totalPages}
          />
        </div>
      </div>
    </div>
  )
}