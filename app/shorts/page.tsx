import { ShortsFeed } from "@/components/shorts-feed"
import { getTrending } from "@/lib/tmdb/client"
import { safeLoad } from "@/lib/tmdb/safe"

export default async function ShortsPage() {
  const items = await safeLoad(() => getTrending("movie", "week"), [])
  return <ShortsFeed items={items} />
}
