import { SearchView } from "@/components/search-view"
import { getTrending } from "@/lib/tmdb/client"
import { safeLoad } from "@/lib/tmdb/safe"

export const metadata = { title: "Search" }

export default async function SearchPage() {
  // A TMDB outage here used to fail the prerender and abort the whole build.
  // The client fetches trending per time window anyway, so an empty seed just
  // means one extra round trip on first paint.
  const trending = await safeLoad(() => getTrending("all"), [])
  return <SearchView trending={trending} />
}
