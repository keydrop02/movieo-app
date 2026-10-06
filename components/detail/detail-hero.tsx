"use client"

import { useState, type ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { Download } from "lucide-react"
import { AddToListPopover } from "@/components/add-to-list"
import { HeroPanelSlot } from "@/components/detail/hero-panel-slot"
import { OverviewText } from "@/components/detail/overview-text"
import { DownloadModal } from "@/components/download-modal"
import { PlayButton } from "@/components/detail/play-button"
import { WatchedButton } from "@/components/detail/watched-button"
import { RateStar } from "@/components/rate-star"
import { img } from "@/lib/tmdb/images"
import type { MediaDetail, Person } from "@/lib/tmdb/types"
import { cx, formatRuntimeLong, rateColor, year } from "@/lib/utils"

export function DetailHero({
  detail,
}: {
  detail: MediaDetail
}) {
  const backdropSrc = img(detail.backdrop_path, "w1280")
  const titleLogo = detail.title_logo ? img(detail.title_logo, "w500") : null
  const name = detail.title
  const [logoFailed, setLogoFailed] = useState(false)

  return (
    <div className="relative w-full">
      <div
        className="relative w-full h-[85vh] lg:h-[75vh] overflow-hidden"
        style={{
          maskImage: "linear-gradient(to bottom, black 40%, transparent 98%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent 98%)",
        }}
      >
        {backdropSrc && (
          <Image
            fill
            priority
            sizes="100vw"
            className="h-full w-full object-cover object-top"
            src={backdropSrc}
            alt={name}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-transparent pointer-events-none hidden lg:block" />
      </div>

<div data-hero-row className="relative z-30 -mt-[24rem] lg:-mt-[22rem] lg:flex lg:items-end lg:justify-between lg:gap-10 px-6 lg:px-16">
        <div className="w-full max-w-[700px] lg:max-w-[650px] lg:min-w-0 flex flex-col items-center lg:items-start">
          {titleLogo && !logoFailed && (
            <Image
              className="detail-logo max-h-28 lg:max-h-48 max-w-[280px] lg:max-w-[520px] w-auto h-auto object-contain origin-center lg:origin-left drop-shadow-2xl"
              src={titleLogo}
              width={500}
              height={140}
              sizes="(max-width: 1024px) 280px, 520px"
              alt=""
              role="presentation"
              onError={() => setLogoFailed(true)}
            />
          )}
          <h1 className={cx("detail-title-text text-3xl lg:text-5xl font-bold text-white drop-shadow-2xl text-center lg:text-left", !titleLogo || logoFailed ? "detail-title-only" : "")}>
            {name}
          </h1>

          <div data-hero-genres className="mt-4 lg:mt-5 flex items-center gap-2 text-sm lg:text-base text-white/90 font-medium flex-wrap justify-center lg:justify-start">
            {detail.genres.map((g, i) => (
              <span key={g.id}>
                {i > 0 && <span className="text-white/40 mx-2">•</span>}
                {g.name}
              </span>
            ))}
          </div>

          <div data-hero-actions className="mt-4 lg:mt-5 flex items-center gap-3 flex-wrap justify-center lg:justify-start">
            <PlayButton
              id={detail.id}
              kind={detail.kind}
              href={
                detail.kind === "movie"
                  ? `/watch/movie/${detail.id}`
                  : `/watch/tv/${detail.id}/${detail.seasons?.[0]?.season_number ?? 1}/1`
              }
              className="px-5 min-w-[112px] text-base"
            />
            <div className="hero-action-pill inline-flex items-center justify-center h-[44px] w-[44px] rounded-full bg-(--surface-elevated) border border-white/25 shadow-lg shadow-black/5 shrink-0">
              <AddToListPopover
                label="Add to list"
                item={detail}
                triggerClass="flex items-center justify-center h-full w-full rounded-full transition-colors hover:bg-(--surface-hover) active:bg-(--surface-hover) outline-none cursor-pointer"
              />
            </div>
            <div className="hero-action-pill inline-flex items-center justify-center h-[44px] w-[44px] rounded-full bg-(--surface-elevated) border border-white/25 shadow-lg shadow-black/5 shrink-0">
              <DownloadTrigger item={detail} />
            </div>
            <div className="hero-action-pill inline-flex items-center justify-center h-[44px] w-[44px] rounded-full bg-(--surface-elevated) border border-white/25 shadow-lg shadow-black/5 shrink-0">
              <WatchedButton id={detail.id} kind={detail.kind} />
            </div>
          </div>

          <div className="mt-3 lg:mt-4 w-full flex flex-wrap items-center gap-x-3 gap-y-1 text-sm lg:text-base text-white/80 font-medium justify-center lg:justify-start">
            <span className="flex items-center gap-1">
              <RateStar color={rateColor(detail.vote_average)} className="w-4 h-4" />
              {detail.vote_average.toFixed(1)}
            </span>
            <span>{year(detail.release_date)}</span>
            {detail.kind === "tv" && detail.number_of_seasons != null && (
              <span>{detail.number_of_seasons} Season{detail.number_of_seasons === 1 ? "" : "s"}</span>
            )}
            {detail.kind === "movie" && detail.runtime != null && <span>{formatRuntimeLong(detail.runtime)}</span>}
            {detail.certification && (
              <span className="px-1.5 py-0.5 border border-white/30 rounded text-xs lg:text-sm">{detail.certification}</span>
            )}
          </div>

          {(detail.directors.length > 0 || detail.creators.length > 0) && (
            <div className="mt-3 w-full text-sm lg:text-base text-white/60 text-center lg:text-left">
              <span className="text-white/40">{detail.kind === "movie" ? "Director:" : "Creators:"}</span>{" "}
              {peopleLink(detail.kind === "movie" ? detail.directors : detail.creators)}
            </div>
          )}

          <OverviewText text={detail.overview} className="mt-4 lg:mt-5 w-full lg:max-w-[560px]" />
        </div>

        <HeroPanelSlot>
          <FactPanel detail={detail} />
        </HeroPanelSlot>
      </div>
    </div>
  )
}

function releaseDate(date: string | null | undefined): string {
  if (!date) return ""
  const d = new Date(`${date}T00:00:00`)
  if (Number.isNaN(d.getTime())) return date
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

function endsAt(runtime: number): string {
  const now = new Date()
  const end = new Date(now.getTime() + runtime * 60_000)
  return `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`
}

function FactPanel({ detail }: { detail: MediaDetail }) {
  const rows: Array<{ label: string; value: ReactNode }> = []

  if (detail.status) rows.push({ label: "Status", value: detail.status })
  if (detail.original_language) rows.push({ label: "Language", value: detail.original_language.toUpperCase() })

  if (detail.kind === "tv") {
    if (detail.release_date) rows.push({ label: "First aired", value: releaseDate(detail.release_date) })
    if (detail.number_of_seasons != null) rows.push({ label: "Seasons", value: String(detail.number_of_seasons) })
    if (detail.number_of_episodes != null) rows.push({ label: "Episodes", value: String(detail.number_of_episodes) })
  } else {
    if (detail.release_date) rows.push({ label: "Released", value: releaseDate(detail.release_date) })
  }

  if (detail.kind === "movie" && detail.runtime != null) {
    rows.push({
      label: "Runtime",
      value: (
        <>
          {formatRuntimeLong(detail.runtime)}
          {endsAt(detail.runtime) && (
            <>
              <span className="text-white/30 mx-1">·</span>
              <span className="text-white/50">Ends {endsAt(detail.runtime)}</span>
            </>
          )}
        </>
      ),
    })
  }

  const companies = detail.production_companies ?? []

  return (
    <div className="w-full lg:w-[280px] lg:shrink-0 mt-2 lg:mt-0 lg:mb-2">
      {rows.length > 0 && (
        <div className="rounded-xl bg-[#141416] border border-[#202023] overflow-hidden">
          <div className="divide-y divide-white/[0.06]">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-white/40">{row.label}</span>
                <span className="text-xs text-white/80">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {companies.length > 0 && (
        <div className="mt-4 grid gap-2 grid-cols-2">
          {companies.map((c) => {
            const src = img(c.logo_path, "w500")
            if (!src) return null
            return (
              <div key={c.id} className="flex items-center justify-center h-10 px-2">
                {/* `fill` needs a sized box, and the logo's aspect ratio is not
                    part of the API response, so the box carries the constraint
                    and `object-contain` letterboxes whatever TMDB sends. */}
                <div className="relative w-full h-7">
                  <Image
                    fill
                    sizes="(max-width: 1024px) 45vw, 300px"
                    src={src}
                    alt={c.name}
                    title={c.name}
                    className="object-contain brightness-0 invert opacity-50"
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function peopleLink(people: Person[]) {
  return people.slice(0, 3).map((p, i) => (
    <span key={p.id}>
      {i > 0 && <span className="text-white/30 mx-1">,</span>}
      <Link href={`/person/${p.id}`} className="text-white/80 hover:text-white hover:underline decoration-white/60 underline-offset-4 transition-colors">
        {p.name}
      </Link>
    </span>
  ))
}

function DownloadTrigger({ item }: { item: MediaDetail }) {
  return (
    <DownloadModal
      item={{ id: item.id, kind: item.kind, title: item.title, seasons: item.seasons ?? [] }}
      label="Download"
      triggerClass="flex items-center justify-center h-full w-full rounded-full transition-colors hover:bg-(--surface-hover) active:bg-(--surface-hover) outline-none cursor-pointer"
    >
      <Download className="w-[18px] h-[18px] text-white" />
    </DownloadModal>
  )
}
