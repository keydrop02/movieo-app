import { ExploreGrid } from "@/components/explore-grid"
import { discover, getGenres, getProvidersList } from "@/lib/tmdb/client"

export default async function MoviesPage() {
  const [genres, providers, disc] = await Promise.all([
    getGenres("movie"),
    getProvidersList(),
    discover("movie", { sort: "popular" }),
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