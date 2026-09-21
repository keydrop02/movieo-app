import { getTrending } from "@/lib/tmdb/client"
import { ShortsFeed } from "@/components/shorts-feed"

export const metadata = { title: "Shorts" }

export default async function ShortsPage() {
  const items = await getTrending("movie", "week")

  return (
    <ShortsFeed items={items} />
  )
}
