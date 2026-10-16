import type { Metadata } from "next"
import { ExploreGrid } from "@/components/explore-grid"
import { discover, getGenres, getProvidersList } from "@/lib/tmdb/client"
import { safeLoad } from "@/lib/tmdb/safe"

export const metadata: Metadata = {
  title: "Movies",
  description: "Browse popular, top-rated and newly released movies. Filter by genre, year and streaming provider.",
  alternates: { canonical: "/movies" },
}

export default async function MoviesPage() {
  const [genres, providers, disc] = await Promise.all([
    safeLoad(() => getGenres("movie"), []),
    safeLoad(getProvidersList, []),
    safeLoad(() => discover("movie", { sort: "popular" }), {
      items: [] as Awaited<ReturnType<typeof discover>>["items"],
      page: 1,
      totalPages: 1,
    }),
  ])

  return (
    <ExploreGrid
      kind="movie"
      genres={genres}
      providers={providers}
      initialItems={disc.items}
      initialTotalPages={disc.totalPages}
      spotlight={[]}
      randomLabel="Surprise me with a movie"
    />
  )
}
