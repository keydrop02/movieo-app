import { SearchView } from "@/components/search-view"
import { getTrending } from "@/lib/tmdb/client"

export const metadata = { title: "Search" }

export default async function SearchPage() {
  const [movies, shows] = await Promise.all([getTrending("movie"), getTrending("tv")])
  const trending = [...movies.slice(0, 9), ...shows.slice(0, 9)].slice(0, 18)
  return <SearchView trending={trending} />
}