"use client"

import { useEffect, useRef, useState } from "react"
import { MediaCard } from "@/components/media-card"
import { GridSkeletons } from "@/components/skeleton"
import type { MediaItem } from "@/lib/tmdb/types"
import { cx } from "@/lib/utils"

export function GridWithFetch({
  query,
  initialItems,
  initialTotalPages,
  children,
}: {
  query: string
  initialItems: MediaItem[]
  initialTotalPages: number
  children?: (props: { items: MediaItem[]; totalPages: number; next: () => void }) => React.ReactNode
}) {
  const [items, setItems] = useState(initialItems)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [loading, setLoading] = useState(false)

  const next = async () => {
    if (loading || page >= totalPages) return
    setLoading(true)
    try {
      const res = await fetch(`/api/discover?${query}&page=${page + 1}`)
      const data = await res.json()
      setItems((prev) => {
        const seen = new Set(prev.map((x) => x.id))
        return [...prev, ...data.items.filter((x: MediaItem) => !seen.has(x.id))]
      })
      setTotalPages(data.totalPages ?? totalPages)
      setPage((p) => p + 1)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {children ? children({ items, totalPages, next }) : defaultGrid(items)}
      {loading && <GridSkeletons count={6} />}
      <Sentinel onHit={next} active={!loading && page < totalPages} />
    </div>
  )
}

function defaultGrid(items: MediaItem[]) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-12">
      {items.map((item, i) => (
        <div key={item.id} className="card-in" style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}>
          <MediaCard item={item} fill />
        </div>
      ))}
    </div>
  )
}

export function Sentinel({ onHit, active }: { onHit: () => void; active: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && active) onHit()
    })
    io.observe(el)
    return () => io.disconnect()
  }, [onHit, active])
  return <div ref={ref} className="h-24 w-full flex items-center justify-center mt-12" />
}

export function ProviderSegmented({
  kind,
  onChange,
}: {
  kind: "movie" | "tv"
  onChange: (kind: "movie" | "tv") => void
}) {
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white/[0.06] ring-1 ring-white/10">
      <button
        onClick={() => onChange("movie")}
        className={cx(
          "px-5 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer",
          kind === "movie" ? "bg-white text-black" : "text-white/60 hover:text-white",
        )}
      >
        Movies
      </button>
      <button
        onClick={() => onChange("tv")}
        className={cx(
          "px-5 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer",
          kind === "tv" ? "bg-white text-black" : "text-white/60 hover:text-white",
        )}
      >
        Series
      </button>
    </div>
  )
}