"use client"

import Link from "next/link"
import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"
import { ExternalLink, Play, X } from "lucide-react"
import { ScrollRail } from "@/components/scroll-rail"
import { img } from "@/lib/tmdb/images"
import { reportError } from "@/lib/error-reporting"
import { useDialog } from "@/lib/use-dialog"
import { loadYtApi } from "@/lib/youtube"
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
      <ScrollRail insetClass="-left-3" endInsetClass="-right-3" className="gap-4 py-2 px-2">
        {cast.map((p) => (
            <Link key={p.id} href={`/person/${p.id}`} className="flex flex-col items-center gap-3 flex-none w-32 lg:w-36 group cursor-pointer text-left">
              <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden bg-white/5 border border-white/10 shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:border-white/30 group-hover:shadow-white/20 z-10">
                {p.profile_path ? (
                  <Image
                    fill
                    sizes="(max-width: 768px) 96px, 112px"
                    className="object-cover"
                    src={img(p.profile_path, "w300") ?? ""}
                    alt={p.name}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white/40 text-xl font-semibold">{p.name.slice(0, 1)}</div>
                )}
              </div>
              <div className="text-center w-full">
                <h3 className="text-sm font-medium text-white/90 line-clamp-1 group-hover:text-white">{p.name}</h3>
                {p.character && <p className="text-xs text-white/50 line-clamp-1 group-hover:text-white/70 mt-0.5">{p.character}</p>}
              </div>
            </Link>
          ))}
      </ScrollRail>
    </Section>
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
      <ScrollRail insetClass="-left-3" endInsetClass="-right-3" className="gap-5 py-2 px-2">
        {trailers.map((v) => (
          <TrailerCard key={v.id} video={v} />
        ))}
      </ScrollRail>
    </Section>
  )
}

function TrailerCard({ video }: { video: Video }) {
  const [open, setOpen] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const playerHostRef = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  const dialogRef = useDialog<HTMLDivElement>(open, close)

  useEffect(() => {
    if (!open || !playerHostRef.current) return
    let player: { destroy: () => void } | null = null
    let cancelled = false
    loadYtApi()
      .then(() => {
        if (cancelled || !playerHostRef.current) return
        player = new window.YT.Player(playerHostRef.current, {
          videoId: video.key,
          playerVars: { autoplay: 1, rel: 0 },
          events: {
            onError: () => {
              if (!cancelled) setBlocked(true)
            },
          },
        })
      })
      .catch((err) => {
        if (!cancelled) setBlocked(true)
        reportError("trailer.youtube-api", err, "warn")
      })
    return () => {
      cancelled = true
      player?.destroy()
    }
  }, [open, video.key])

  return (
    <div className="flex-none w-80 lg:w-[420px]">
      <button
        onClick={() => {
          setBlocked(false)
          setOpen(true)
        }}
        className="relative w-full aspect-video rounded-xl overflow-hidden bg-black/20 border border-white/5 group cursor-pointer block"
        aria-label={video.name}
      >
        <Image
          fill
          sizes="(max-width: 1024px) 320px, 420px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          src={`https://i.ytimg.com/vi/${video.key}/hqdefault.jpg`}
          alt={video.name}
        />
        <span className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 opacity-0 group-hover:opacity-100">
          <span className="bg-white text-black rounded-full p-3 transition-transform group-hover:scale-110 shadow-lg" aria-hidden>
            <Play className="w-5 h-5 fill-current" />
          </span>
        </span>
        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/75 border border-white/15 text-[11px] font-medium text-white max-w-[70%] truncate">
          {video.name}
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
          <div
            className="absolute inset-0 bg-black/80"
            onClick={close}
            aria-hidden
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Trailer: ${video.name}`}
            className="relative w-full max-w-4xl"
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="Close trailer"
              className="absolute -top-12 right-0 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="relative aspect-video rounded-xl overflow-hidden bg-black shadow-2xl">
              {blocked ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
                  <p className="text-white/60 text-sm">This trailer can&apos;t be played in the embedded player.</p>
                  <a
                    href={`https://www.youtube.com/watch?v=${video.key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 hover:scale-105 transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Watch on YouTube
                  </a>
                </div>
              ) : (
                <div ref={playerHostRef} className="absolute inset-0 w-full h-full" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
