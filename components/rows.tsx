"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { MediaCard, ProviderTile } from "@/components/media-card"
import type { MediaItem } from "@/lib/tmdb/types"
import { cx } from "@/lib/utils"

const MASK = "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)"

export function RowHeader({
  title,
  titleClass = "text-xl lg:text-2xl font-semibold text-white/90 shadow-black drop-shadow-md",
}: {
  title: string
  titleClass?: string
}) {
  return (
    <div className={cx("flex items-center justify-between", "space-y-0")}>
      <h2 className={cx("transition-all duration-300", titleClass)}>{title}</h2>
    </div>
  )
}

export function PosterRow({
  items,
  header,
  mask = true,
  padClass = "px-6 lg:px-16",
  minH = "min-h-0",
  gap = "gap-4",
}: {
  items: MediaItem[]
  header?: { title: string }
  mask?: boolean
  padClass?: string
  minH?: string
  gap?: string
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canRight, setCanRight] = useState(true)
  const [canLeft, setCanLeft] = useState(false)

  const scroll = (dir: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" })
  }

  const onScroll = () => {
    const el = trackRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 4)
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }

  useEffect(() => {
    onScroll()
    window.addEventListener("resize", onScroll)
    return () => window.removeEventListener("resize", onScroll)
  }, [])

  return (
    <div className="space-y-2 relative z-10 group/row">
      <div className="px-6 lg:px-16">
        {header && <RowHeader title={header.title} />}
      </div>
      <div className="relative">
        <RowScrollButton side="left" visible={canLeft} onClick={() => scroll(-1)} />
        <RowScrollButton side="right" visible={canRight} onClick={() => scroll(1)} />
        <div
          ref={trackRef}
          onScroll={onScroll}
          className={cx(
            "flex overflow-x-auto overflow-y-clip pt-2 scrollbar-hide items-start isolate",
            gap,
            padClass,
            minH,
          )}
          style={mask ? { maskImage: MASK, WebkitMaskImage: MASK } : undefined}
        >
          {items.map((item) => (
            <MediaCard key={`${item.kind}-${item.id}`} item={item} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function RowScrollButton({ side, visible, onClick }: { side: "left" | "right"; visible: boolean; onClick: () => void }) {
  return (
    <button
      aria-label={side === "left" ? "Scroll left" : "Scroll right"}
      onClick={onClick}
      className={cx(
        "hidden lg:flex absolute top-1/2 -translate-y-1/2 z-[60] w-12 h-12 bg-transparent drop-shadow-lg transition-all duration-300 items-center justify-center hover:scale-110 cursor-pointer",
        side === "left" ? "left-4" : "right-4",
        visible
          ? "opacity-0 pointer-events-none group-hover/row:opacity-100 group-hover/row:pointer-events-auto"
          : "opacity-0 pointer-events-none",
      )}
    >
      {side === "left" ? (
        <ChevronLeft className="w-10 h-10 text-white drop-shadow-md" />
      ) : (
        <ChevronRight className="w-10 h-10 text-white drop-shadow-md" />
      )}
    </button>
  )
}

export function ProviderTileRow({ providers }: { providers: Array<{ id: number; name: string; logo_path: string }> }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canRight, setCanRight] = useState(true)
  const [canLeft, setCanLeft] = useState(false)
  const scroll = (dir: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    el.scrollBy({ left: dir * 480, behavior: "smooth" })
  }
  const onScroll = () => {
    const el = trackRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 4)
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }
  useEffect(() => {
    onScroll()
    window.addEventListener("resize", onScroll)
    return () => window.removeEventListener("resize", onScroll)
  }, [])
  return (
    <div className="space-y-4 relative z-10 group/row">
      <div className="px-6 lg:px-16">
        <h2 className="text-xl lg:text-2xl font-semibold text-white/90 shadow-black drop-shadow-md">Browse by Provider</h2>
      </div>
      <div className="relative">
        <RowScrollButton side="left" visible={canLeft} onClick={() => scroll(-1)} />
        <RowScrollButton side="right" visible={canRight} onClick={() => scroll(1)} />
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="flex gap-5 lg:gap-6 overflow-x-auto overflow-y-visible pt-2 px-6 lg:px-16 scrollbar-hide items-start"
          style={{ maskImage: MASK, WebkitMaskImage: MASK }}
        >
          {providers.map((p) => (
            <ProviderTile key={p.id} id={p.id} name={p.name} logoPath={p.logo_path} />
          ))}
        </div>
      </div>
    </div>
  )
}
