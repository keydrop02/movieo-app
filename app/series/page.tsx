import type { Metadata } from "next"
import { ExploreGrid } from "@/components/explore-grid"
import { discover, getGenres, getProvidersList } from "@/lib/tmdb/client"
import { safeLoad } from "@/lib/tmdb/safe"

export const metadata: Metadata = {
  title: "TV Shows",
  description: "Browse trending, top-rated and currently airing TV shows. Filter by genre, year and streaming provider.",
  alternates: { canonical: "/series" },
}

export default async function SeriesPage() {
  const [genres, providers, disc] = await Promise.all([
    safeLoad(() => getGenres("tv"), []),
    safeLoad(getProvidersList, []),
    safeLoad(() => discover("tv", { sort: "popular" }), {
      items: [] as Awaited<ReturnType<typeof discover>>["items"],
      page: 1,
      totalPages: 1,
    }),
  ])

  return (
    <ExploreGrid
      kind="tv"
      genres={genres}
      providers={providers}
      initialItems={disc.items}
      initialTotalPages={disc.totalPages}
      spotlight={[]}
      randomLabel="Surprise me with a series"
    />
  )
}
