import { notFound } from "next/navigation"
import { WatchPlayer } from "@/components/watch-player"
import { getDetail, getEpisodes } from "@/lib/tmdb/client"
import { mediaUrl } from "@/lib/utils"
import { img } from "@/lib/tmdb/images"

export const dynamic = "force-dynamic"

export default async function WatchTvPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; season: string; episode: string }>
  searchParams: Promise<{ server?: string }>
}) {
  const [{ id: idRaw, season, episode }] = await Promise.all([params, searchParams])
  const id = Number(idRaw)
  const seasonNum = Number(season)
  const epNum = Number(episode)
  if (!id || !seasonNum || !epNum) notFound()

  const detail = await getDetail("tv", id)
  if (!detail.title) notFound()

  const episodes = await getEpisodes(id, seasonNum)
  const episodeItem = episodes.find((e) => e.episode_number === epNum) ?? null

  return (
    <WatchPlayer
      id={detail.id}
      kind="tv"
      title={detail.title}
      season={seasonNum}
      episodeNumber={epNum}
      episodeName={episodeItem?.name ?? null}
      seasons={detail.seasons ?? []}
      poster={img(detail.poster_path)}
      backdrop={img(detail.backdrop_path, "w1280")}
      rating={detail.vote_average}
      releaseDate={detail.release_date}
      backHref={mediaUrl(detail)}
    />
  )
}