import type { Metadata } from "next"
import { ShortsFeed } from "@/components/shorts-feed"
import { getTrending } from "@/lib/tmdb/client"
import { safeLoad } from "@/lib/tmdb/safe"

export const metadata: Metadata = {
  title: "Shorts",
  description: "Swipe through a feed of this week's trending movies and shows.",
  alternates: { canonical: "/shorts" },
}

export default async function ShortsPage() {
  const items = await safeLoad(() => getTrending("movie", "week"), [])
  return <ShortsFeed items={items} />
}
