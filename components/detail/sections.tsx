"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react"
import { img } from "@/lib/tmdb/images"
import type { Person, Video } from "@/lib/tmdb/types"

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl lg:text-2xl font-bold text-white/90 px-2">{children}</h2>
}

export function Section({ children }: { children: React.ReactNode }) {
  return <div className="space-y-5">{children}</div>
}

export function CastSection({ cast }: { cast: Person[] }) {
  if (!cast.length) return null
  return (
    <Section>
      <SectionHeading>Cast</SectionHeading>
      <div className="relative group/cast">
        <CastScroll group="cast" />
        <div data-scroll="cast" className="flex gap-4 overflow-x-auto py-2 px-2 scrollbar-hide items-start">
          {cast.map((p) => (
            <Link key={p.id} href={`/person/${p.id}`} className="flex flex-col items-center gap-3 flex-none w-32 lg:w-36 group cursor-pointer text-left">
              <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden bg-white/5 border border-white/10 shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:border-white/30 group-hover:shadow-white/20 z-10">
                {p.profile_path ? (
                  <img className="w-full h-full object-cover" loading="lazy" src={img(p.profile_path, "w300") ?? undefined} alt={p.name} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/40 text-xl font-semibold">{p.name.slice(0, 1)}</div>
                )}
              </div>
              <div className="text-center w-full">
                <h3 className="text-sm font-medium text-white/90 line-clamp-1 group-hover:text-white">{p.name}</h3>
                {p.character && <p className="text-xs text-white/50 line-clamp-1 group-hover:text-white/70 mt-0.5">{p.character}</p>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Section>
  )
}

function CastScroll({ group, dist = 340 }: { group: string; dist?: number }) {
  const el = () => document.querySelector<HTMLElement>(`[data-scroll="${group}"]`)
  const scrollBy = (dir: 1 | -1) => () => el()?.scrollBy({ left: dir * dist, behavior: "smooth" })
  return (
    <>
      <button
        onClick={scrollBy(-1)}
        aria-label="Scroll left"
        className="hidden lg:flex absolute -left-3 top-[42%] -translate-y-1/2 z-[60] w-10 h-10 items-center justify-center bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-white/10 transition-all opacity-0 group-hover/cast:opacity-100 pointer-events-none group-hover/cast:pointer-events-auto cursor-pointer"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={scrollBy(1)}
        aria-label="Scroll right"
        className="hidden lg:flex absolute -right-3 top-[42%] -translate-y-1/2 z-[60] w-10 h-10 items-center justify-center bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-white/10 transition-all opacity-0 group-hover/cast:opacity-100 pointer-events-none group-hover/cast:pointer-events-auto cursor-pointer"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </>
  )
}

export function TrailersSection({ videos }: { videos: Video[] }) {
  const trailers = videos
    .filter((v) => v.site === "YouTube" && v.official !== false && (v.type === "Trailer" || v.type === "Teaser"))
    .sort((a, b) => Number(b.official === true) - Number(a.official === true))
  if (!trailers.length) return null
  return (
    <Section>
      <SectionHeading>Trailers</SectionHeading>
      <div className="flex gap-5 overflow-x-auto pt-2 px-2 scrollbar-hide">
        {trailers.map((v) => (
          <TrailerCard key={v.id} video={v} />
        ))}
      </div>
    </Section>
  )
}

function TrailerCard({ video }: { video: Video }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [open])

  return (
    <div className="flex-none w-80 lg:w-[420px]">
      <button
        onClick={() => setOpen(true)}
        className="relative w-full aspect-video rounded-xl overflow-hidden bg-black/20 border border-white/5 group cursor-pointer block"
        aria-label={video.name}
      >
        <img
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          src={`https://i.ytimg.com/vi/${video.key}/hqdefault.jpg`}
          alt={video.name}
        />
        <span className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 opacity-0 group-hover:opacity-100">
          <span className="bg-white text-black rounded-full p-3 transition-transform group-hover:scale-110 shadow-lg" aria-hidden>
            <Play className="w-5 h-5 fill-current" />
          </span>
        </span>
        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[11px] font-medium text-white max-w-[70%] truncate">
          {video.name}
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-4xl">
            <button
              onClick={() => setOpen(false)}
              aria-label="Close trailer"
              className="absolute -top-12 right-0 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="relative aspect-video rounded-xl overflow-hidden bg-black shadow-2xl">
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube-nocookie.com/embed/${video.key}?autoplay=1`}
                title={video.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
