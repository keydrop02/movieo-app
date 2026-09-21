"use client"

import { useState } from "react"
import Link from "next/link"
import { CalendarDays, Film, Info, Play } from "lucide-react"
import { img } from "@/lib/tmdb/images"
import type { MediaItem } from "@/lib/tmdb/types"
import { cx, year, rateColor } from "@/lib/utils"
import { AddToListPopover } from "@/components/add-to-list"
import { RateStar } from "@/components/rate-star"

export function HeroCarousel({
  items,
  titleLogos,
  genreNames,
}: {
  items: MediaItem[]
  titleLogos?: Record<number, string | null>
  genreNames?: Record<number, string>
}) {
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const active = items[Math.min(idx, items.length - 1)]

  const advance = () => setIdx((i) => (i + 1) % items.length)

  if (!active) return null

  const slide = items.find((i) => i.id === active.id) ?? active
  const src = img(slide.backdrop_path, "w1280")
  const titleLogo = titleLogos?.[slide.id] ?? null
  const genre =
    slide.genre_ids?.map((id) => genreNames?.[id]).find((name): name is string => Boolean(name)) ?? "Epic"

  return (
    <div
      className="relative h-[85vh] w-full group"
      tabIndex={0}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        className="absolute top-0 left-0 right-0 z-0 overflow-hidden"
        style={{
          height: "calc(100% + 20vh)",
          maskImage: "linear-gradient(to bottom, black 40%, transparent 98%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent 98%)",
        }}
      >
        <img className="h-full w-full object-cover object-top" src={src ?? undefined} alt={slide.title} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent pointer-events-none" />
      </div>

      <div className="absolute inset-0 flex items-end px-6 lg:pl-16 z-20 pb-20 lg:pb-0">
        <div className="w-full max-w-2xl gap-4 lg:gap-6 flex flex-col items-center lg:items-start text-center lg:text-left mx-auto lg:mx-0">
          <div className="gap-4 lg:gap-6 flex flex-col items-center lg:items-start w-full">
            <div className="relative group cursor-pointer">
              <HeroTitle key={slide.id} slide={slide} src={titleLogo} />
            </div>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 lg:gap-3 text-white font-medium drop-shadow-md text-sm lg:text-base">
              <HeroRating value={slide.vote_average} />
              <span className="text-white/50 select-none text-[8px] lg:text-[10px]">•</span>
              <YearChip value={year(slide.release_date)} />
              <span className="text-white/50 select-none text-[8px] lg:text-[10px]">•</span>
              <IconChip Icon={Film} text={genre} />
            </div>
            <p className="line-clamp-2 text-base lg:text-lg text-white max-w-xl drop-shadow-md font-medium text-center lg:text-left">
              {slide.overview}
            </p>
          </div>

          <div className="flex items-center justify-center lg:justify-start gap-3 w-full">
            <Link
              href={slide.kind === "movie" ? `/watch/movie/${slide.id}` : `/watch/tv/${slide.id}/1/1`}
              className="inline-block"
            >
              <PlayButton />
            </Link>
            <div className="hero-action-pill inline-flex items-center h-[52px] shrink-0 rounded-full bg-white/10 backdrop-blur-[20px] backdrop-saturate-150 border border-white/10 shadow-lg shadow-black/5">
              <AddToListPopover label="Add to list" item={slide} />
              <div className="w-px h-6 bg-white/25 shrink-0" />
              <Link
                href={slide.kind === "movie" ? `/movie/${slide.id}` : `/series/${slide.id}`}
                className="group/btn flex items-center justify-center h-full px-5 rounded-r-full transition-colors hover:bg-white/10 active:bg-white/20 outline-none cursor-pointer"
                aria-label="More Info"
              >
                <Info className="w-5 h-5 text-white" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 hidden lg:flex gap-2 z-30 items-center">
        {items.map((item, i) => (
          <button
            key={item.id}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setIdx(i)}
            className={cx(
              "h-2 rounded-full cursor-pointer shadow-lg overflow-hidden transition-[width,background-color] duration-300",
              i === idx ? "w-8 bg-white/30" : "w-2 bg-white/40 hover:bg-white/60",
            )}
          >
            {i === idx && (
              <span
                className={cx("block h-full bg-white dot-filling", paused && "dot-anim-paused")}
                key={idx}
                onAnimationEnd={advance}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

function HeroTitle({ slide, src }: { slide: MediaItem; src: string | null | undefined }) {
  const [failed, setFailed] = useState(false)
  const logoFailed = !src || failed

  return (
    <>
      <h1
        className={cx(
          "hero-title-text font-extrabold tracking-tight drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)] text-4xl lg:text-7xl text-white leading-tight max-w-lg lg:max-w-2xl",
          logoFailed && "hero-title-only",
        )}
      >
        {slide.title}
      </h1>
      {!logoFailed && (
        <img
          key={src}
          className="hero-logo max-h-28 lg:max-h-48 object-contain origin-center lg:origin-left drop-shadow-2xl"
          src={img(src, "w500") ?? undefined}
          alt={slide.title}
          onError={() => setFailed(true)}
        />
      )}
    </>
  )
}

export function HeroRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <RateStar color={rateColor(value)} className="w-4 h-4 lg:w-[18px] lg:h-[18px]" />
      <span className="text-white font-semibold">
        {value.toFixed(1)}
        <span className="text-white/60 font-medium">/10</span>
      </span>
    </div>
  )
}

function PlayButton() {
  return (
    <button className="relative rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 font-semibold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed select-none h-[52px] theme-btn-primary hover:scale-105 shadow-xl shadow-black/10 px-6 text-lg font-bold min-w-[130px]">
      <Play className="w-5 h-5 mr-1.5 fill-current" />
      <span>Play</span>
    </button>
  )
}

function YearChip({ value }: { value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <CalendarDays className="w-4 h-4" />
      <span className="text-white">{value}</span>
    </div>
  )
}

function IconChip({ Icon, text }: { Icon: typeof Film; text: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="w-4 h-4" />
      <span className="text-white">{text}</span>
    </div>
  )
}
