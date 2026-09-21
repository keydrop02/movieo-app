"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Play, Volume2, VolumeX, Info, ArrowLeft, ChevronUp, ChevronDown } from "lucide-react"
import type { MediaItem, Video } from "@/lib/tmdb/types"
import { mediaUrl, rateColor } from "@/lib/utils"
import Link from "next/link"

interface ShortItem extends MediaItem {
  trailer?: Video | null
}

declare global {
  interface Window {
    YT: {
      Player: new (div: HTMLElement, opts: Record<string, unknown>) => {
        mute: () => void
        unMute: () => void
        destroy: () => void
        onError?: (e: { data?: number }) => void
      }
    }
    onYouTubeIframeAPIReady: () => void
  }
}

let ytApiPromise: Promise<void> | null = null
function loadYtApi() {
  if (ytApiPromise) return ytApiPromise
  ytApiPromise = new Promise<void>((resolve) => {
    if (typeof window === "undefined") return resolve()
    if (window.YT?.Player) return resolve()
    const tag = document.createElement("script")
    tag.src = "https://www.youtube.com/iframe_api"
    document.head.appendChild(tag)
    window.onYouTubeIframeAPIReady = () => resolve()
  })
  return ytApiPromise
}

export function ShortsFeed({ items }: { items: MediaItem[] }) {
  const [enriched, setEnriched] = useState<ShortItem[]>(items.map((i) => ({ ...i, trailer: undefined })))
  const [activeIdx, setActiveIdx] = useState(0)
  const [muted, setMuted] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const fetchedRef = useRef<Set<number>>(new Set())
  const router = useRouter()

  const scrollTo = (idx: number) => {
    const container = containerRef.current
    if (!container) return
    const child = container.children[idx] as HTMLElement | undefined
    child?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    const idx = activeIdx
    const item = enriched[idx]
    if (!item || fetchedRef.current.has(item.id)) return
    fetchedRef.current.add(item.id)

    ;(async () => {
      try {
        const res = await fetch(`/api/detail/${item.kind}/${item.id}`)
        const detail = await res.json()
        const trailer = (detail.videos ?? []).find(
          (v: Video) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")
        ) ?? null
        setEnriched((prev) => {
          const next = [...prev]
          next[idx] = { ...next[idx], trailer }
          return next
        })
      } catch {
        setEnriched((prev) => {
          const next = [...prev]
          next[idx] = { ...next[idx], trailer: null }
          return next
        })
      }
    })()
  }, [activeIdx, enriched])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const children = container.children
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const idx = Array.from(children).indexOf(entry.target)
            if (idx !== -1) setActiveIdx(idx)
          }
        }
      },
      { root: container, threshold: 0.5 },
    )
    Array.from(children).forEach((child) => observer.observe(child))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="relative h-dvh overflow-hidden bg-black">
      <button
        onClick={() => router.back()}
        className="absolute top-4 left-4 z-30 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-30 flex-col gap-2">
        <button
          onClick={() => scrollTo(Math.max(0, activeIdx - 1))}
          disabled={activeIdx === 0}
          className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
        <button
          onClick={() => scrollTo(Math.min(enriched.length - 1, activeIdx + 1))}
          disabled={activeIdx === enriched.length - 1}
          className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      <div
        ref={containerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
      >
      {enriched.map((item, i) => (
        <ShortCard
          key={item.id}
          item={item}
          active={i === activeIdx}
          muted={muted}
          onToggleMute={() => setMuted((m) => !m)}
        />
      ))}
      </div>
    </div>
  )
}

function ShortCard({
  item,
  active,
  muted,
  onToggleMute,
}: {
  item: ShortItem
  active: boolean
  muted: boolean
  onToggleMute: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<InstanceType<typeof window.YT.Player> | null>(null)
  const readyRef = useRef(false)
  const playing = active && !!item.trailer
  const backdrop = item.backdrop_path
    ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}`
    : item.poster_path
      ? `https://image.tmdb.org/t/p/w780${item.poster_path}`
      : null

  const mutedRef = useRef(muted)
  useEffect(() => { mutedRef.current = muted })

  useEffect(() => {
    if (!playing || !containerRef.current || playerRef.current) return
    const divId = `yt-${item.id}`

    loadYtApi().then(() => {
      if (playerRef.current || !containerRef.current) return
      const wrapper = containerRef.current
      if (!wrapper) return

      const div = document.createElement("div")
      div.id = divId
      div.style.cssText = "position:absolute;inset:0;width:120%;height:120%;left:-10%;top:-10%"
      wrapper.prepend(div)

      playerRef.current = new window.YT.Player(div, {
        videoId: item.trailer!.key,
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          loop: 1,
          playlist: item.trailer!.key,
          iv_load_policy: 3,
          fs: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            readyRef.current = true
            if (!mutedRef.current) {
              playerRef.current?.unMute()
            }
          },
        },
      })
    })

    return () => {
      if (playerRef.current) {
        try { playerRef.current.destroy() } catch {}
        playerRef.current = null
        readyRef.current = false
      }
      const el = document.getElementById(divId)
      if (el) el.remove()
    }
  }, [playing, item.id, item.trailer?.key])

  useEffect(() => {
    if (!readyRef.current || !playerRef.current) return
    if (muted) {
      playerRef.current.mute()
    } else {
      playerRef.current.unMute()
    }
  }, [muted])

  return (
    <div className="relative h-dvh w-full snap-start snap-always flex items-center justify-center bg-black">
      <div className="w-full h-full sm:w-auto sm:h-auto sm:flex sm:items-center sm:justify-center sm:gap-4">
        <div ref={containerRef} className="relative w-full h-full sm:w-[min(100vw,420px)] sm:h-[min(100dvh,780px)] sm:rounded-2xl overflow-hidden bg-neutral-900 sm:shadow-2xl sm:shadow-black/60">
          {!playing && backdrop && (
            <img
              src={backdrop}
              alt={item.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {!playing && !backdrop && (
            <div className="absolute inset-0 bg-white/5" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/15 pointer-events-none" />

          <div className="absolute bottom-0 left-0 right-0 sm:right-14 p-4 pb-5 z-20">
            <h3 className="text-white font-bold text-base leading-snug drop-shadow-lg">{item.title}</h3>
            <p className="text-white/55 text-xs mt-1.5 line-clamp-2 leading-relaxed">{item.overview}</p>
            <div className="flex items-center gap-2.5 mt-2.5">
              {item.vote_average > 0 && (
                <span className="text-[11px] font-semibold" style={{ color: rateColor(item.vote_average) }}>★ {item.vote_average.toFixed(1)}</span>
              )}
              {item.release_date && (
                <span className="text-white/35 text-[11px]">{item.release_date.slice(0, 4)}</span>
              )}
            </div>
          </div>

          {!playing && item.trailer !== undefined && !item.trailer && (
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="flex flex-col items-center gap-2">
                <span className="bg-white/10 backdrop-blur-md rounded-full p-4">
                  <Play className="w-6 h-6 text-white fill-current" />
                </span>
                <span className="text-white/40 text-xs">No trailer</span>
              </div>
            </div>
          )}

          {!playing && item.trailer === undefined && (
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>

        <div className="hidden sm:flex flex-col items-center gap-5">
          <Link href={`/watch/${item.kind}/${item.id}`} className="flex flex-col items-center gap-1 cursor-pointer">
            <span className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors">
              <Play className="w-5 h-5 text-white fill-current" />
            </span>
            <span className="text-white/60 text-[10px] font-medium">Play</span>
          </Link>
          <Link href={mediaUrl(item)} className="flex flex-col items-center gap-1 cursor-pointer">
            <span className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors">
              <Info className="w-5 h-5 text-white" />
            </span>
            <span className="text-white/60 text-[10px] font-medium">Info</span>
          </Link>
          <button onClick={onToggleMute} className="flex flex-col items-center gap-1 cursor-pointer">
            <span className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors">
              {muted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
            </span>
            <span className="text-white/60 text-[10px] font-medium">{muted ? "Unmute" : "Mute"}</span>
          </button>
        </div>
      </div>

      <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-5 sm:hidden">
        <Link href={`/watch/${item.kind}/${item.id}`} className="flex flex-col items-center gap-1 cursor-pointer">
          <span className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors">
            <Play className="w-5 h-5 text-white fill-current" />
          </span>
          <span className="text-white/60 text-[10px] font-medium">Play</span>
        </Link>
        <Link href={mediaUrl(item)} className="flex flex-col items-center gap-1 cursor-pointer">
          <span className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors">
            <Info className="w-5 h-5 text-white" />
          </span>
          <span className="text-white/60 text-[10px] font-medium">Info</span>
        </Link>
        <button onClick={onToggleMute} className="flex flex-col items-center gap-1 cursor-pointer">
          <span className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors">
            {muted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
          </span>
          <span className="text-white/60 text-[10px] font-medium">{muted ? "Unmute" : "Mute"}</span>
        </button>
      </div>
    </div>
  )
}
