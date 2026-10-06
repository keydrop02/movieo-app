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

/**
 * Detail pages previously exported no metadata, so every movie and show URL
 * rendered the site-wide default title and description. Social shares and search
 * results showed "Movies, Shows & More - Movieo" for all of them.
 */
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const id = Number(slug.split("-")[0])
  if (!id) return { title: "Not found" }

  try {
    const detail = await getDetail("movie", id)
    if (!detail.title) return { title: "Not found" }

    const title = detail.title
    const released = year(detail.release_date)
    const description =
      detail.overview?.trim() ||
      `Watch ${title}${released ? ` (${released})` : ""} online on ${site.name}.`
    const backdrop = detail.backdrop_path ? img(detail.backdrop_path, "w1280") : null

    return {
      title,
      description,
      alternates: { canonical: mediaUrl({ id, kind: "movie", title, release_date: detail.release_date }) },
      openGraph: {
        type: "video.movie",
        title,
        description,
        url: mediaUrl({ id, kind: "movie", title, release_date: detail.release_date }),
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

export default async function MoviePage({ params }: Params) {
  const { slug } = await params
  const id = Number(slug.split("-")[0])
  if (!id) notFound()

  const detail = await getDetail("movie", id)
  if (!detail.title) notFound()

  // Canonicalize to the slug form rail cards already link to, so a bare /movie/123
  // URL 308s to /movie/123-some-title-2026 instead of rendering a duplicate page.
  const canonical = mediaUrl({ id, kind: "movie", title: detail.title, release_date: detail.release_date })
  if (canonical !== `/movie/${slug}`) permanentRedirect(canonical)

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