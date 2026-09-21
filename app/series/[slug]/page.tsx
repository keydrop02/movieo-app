import { notFound } from "next/navigation"
import { DetailHero } from "@/components/detail/detail-hero"
import { CastSection, Section, SectionHeading } from "@/components/detail/sections"
import { PosterRow } from "@/components/rows"
import { getDetail } from "@/lib/tmdb/client"

export default async function SeriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const id = Number(slug.split("-")[0])
  if (!id) notFound()

  const detail = await getDetail("tv", id)
  if (!detail.title) notFound()

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden pb-24">
      <div className="relative w-full">
        <DetailHero detail={detail} />
      </div>

      <div className="relative z-20 mt-10 lg:mt-14 px-6 lg:px-16 space-y-10 lg:space-y-14">

        <CastSection cast={detail.cast} />
        <Section>
          <SectionHeading>You Might Also Like</SectionHeading>
          <PosterRow items={detail.similar} mask={false} padClass="px-2" minH="min-h-[240px] sm:min-h-[310px] lg:min-h-[384px]" />
        </Section>
      </div>
    </div>
  )
}