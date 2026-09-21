import { ExploreGrid } from "@/components/explore-grid"
import { discover, getGenres, getProvidersList } from "@/lib/tmdb/client"

export default async function SeriesPage() {
  const [genres, providers, disc] = await Promise.all([
    getGenres("tv"),
    getProvidersList(),
    discover("tv", { sort: "popular" }),
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