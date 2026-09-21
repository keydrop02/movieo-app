import { notFound } from "next/navigation"
import { WatchPlayer } from "@/components/watch-player"
import { getDetail } from "@/lib/tmdb/client"
import { mediaUrl } from "@/lib/utils"
import { img } from "@/lib/tmdb/images"

export const dynamic = "force-dynamic"

export default async function WatchMoviePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ server?: string }>
}) {
  const [{ id: idRaw }] = await Promise.all([params, searchParams])
  const id = Number(idRaw)
  if (!id) notFound()

  const detail = await getDetail("movie", id)
  if (!detail.title) notFound()

  return (
    <WatchPlayer
      id={detail.id}
      kind="movie"
      title={detail.title}
      season={1}
      episodeNumber={1}
      poster={img(detail.poster_path)}
      backdrop={img(detail.backdrop_path, "w1280")}
      rating={detail.vote_average}
      releaseDate={detail.release_date}
      backHref={mediaUrl(detail)}
    />
  )
}