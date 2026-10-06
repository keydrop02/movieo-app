import type { Metadata } from "next"
import { notFound, permanentRedirect } from "next/navigation"
import { DetailHero } from "@/components/detail/detail-hero"
import { CastSection, Section, SectionHeading, TrailersSection } from "@/components/detail/sections"
import { PosterRow } from "@/components/rows"
import { getDetail } from "@/lib/tmdb/client"
import { img } from "@/lib/tmdb/images"
import { site } from "@/lib/site"
import { mediaUrl, year } from "@/lib/utils"

type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const id = Number(slug.split("-")[0])
  if (!id) return { title: "Not found" }

  try {
    const detail = await getDetail("tv", id)
    if (!detail.title) return { title: "Not found" }

    const title = detail.title
    const firstAired = detail.release_date
    const description =
      detail.overview?.trim() ||
      `Watch ${title}${firstAired ? ` (${year(firstAired)})` : ""} online on ${site.name}.`
    const canonical = mediaUrl({ id, kind: "tv", title, release_date: detail.release_date })
    const backdrop = detail.backdrop_path ? img(detail.backdrop_path, "w1280") : null

    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        type: "video.tv_show",
        title,
        description,
        url: canonical,
        images: backdrop ? [{ url: backdrop, width: 1280, height: 720, alt: title }] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: backdrop ? [backdrop] : undefined,
      },
    }
  } catch {
    return { title: "Not found" }
  }
}

export default async function SeriesPage({ params }: Params) {
  const { slug } = await params
  const id = Number(slug.split("-")[0])
  if (!id) notFound()

  const detail = await getDetail("tv", id)
  if (!detail.title) notFound()

  const canonical = mediaUrl({ id, kind: "tv", title: detail.title, release_date: detail.release_date })
  if (canonical !== `/series/${slug}`) permanentRedirect(canonical)

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden pb-24">
      <div className="relative w-full">
        <DetailHero detail={detail} />
      </div>

      <div className="relative z-20 mt-10 lg:mt-14 px-6 lg:px-16 space-y-10 lg:space-y-14">
        <CastSection cast={detail.cast} />
        <TrailersSection videos={detail.videos} />
        {detail.collection && detail.collection.parts.length > 0 && (
          <Section>
            <SectionHeading>{detail.collection.name}</SectionHeading>
            <PosterRow items={detail.collection.parts} mask={false} padClass="px-2" />
          </Section>
        )}
        <Section>
          <SectionHeading>You Might Also Like</SectionHeading>
          <PosterRow items={detail.similar} mask={false} padClass="px-2" minH="min-h-[240px] sm:min-h-[310px] lg:min-h-[384px]" />
        </Section>
      </div>
    </div>
  )
}
