"use client"

import { useEffect, useRef, useState } from "react"
import { MediaCard } from "@/components/media-card"
import { GridSkeletons } from "@/components/skeleton"
import { reportError } from "@/lib/error-reporting"
import type { MediaItem } from "@/lib/tmdb/types"
import { cx } from "@/lib/utils"

/**
 * Appends a page of discover results as the sentinel scrolls into view.
 *
 * The optional render-prop override was removed: nothing used it, and invoking
 * a caller-supplied function during render is what tripped the compiler rule
 * against accessing refs (the callback closes over `next`, which reads
 * `inFlight`). Keeping the grid markup here makes the component's contract
 * explicit.
 */
export function GridWithFetch({
  query,
  initialItems,
  initialTotalPages,
}: {
  query: string
  initialItems: MediaItem[]
  initialTotalPages: number
}) {  const [items, setItems] = useState(initialItems)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Guards against a second fetch while one is in flight. `loading` is state,
  // so an IntersectionObserver callback can fire again before React re-renders.
  const inFlight = useRef(false)

  const next = async () => {
    if (inFlight.current || page >= totalPages) return
    inFlight.current = true
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/discover?${query}&page=${page + 1}`)
      if (!res.ok) throw new Error(`discover ${res.status}`)
      const data: { items?: MediaItem[]; totalPages?: number } = await res.json()
      const incoming = Array.isArray(data.items) ? data.items : []
      setItems((prev) => {
        // Key on kind as well as id: TMDB ids are only unique within a kind, so
        // a movie and a show sharing an id would otherwise silently drop one.
        const seen = new Set(prev.map((x) => `${x.kind}:${x.id}`))
        return [...prev, ...incoming.filter((x) => !seen.has(`${x.kind}:${x.id}`))]
      })
      setTotalPages(data.totalPages ?? totalPages)
      setPage((p) => p + 1)
    } catch (err) {
      // Previously there was no catch, so a failed page load surfaced as an
      // unhandled promise rejection with no user-facing signal at all.
      setError("Couldn't load more titles.")
      reportError("discover.paginate", err, "warn")
    } finally {
      inFlight.current = false
      setLoading(false)
    }
  }

  const retry = () => {
    void next()
  }

  return (
    <div>
      {defaultGrid(items)}
      {loading && <GridSkeletons count={6} />}
      {error && (
        <div className="mt-8 flex flex-col items-center gap-3 text-center" role="alert">
          <p className="text-white/70 text-sm">{error}</p>
          <button
            type="button"
            onClick={retry}
            className="px-4 py-2 rounded-full border border-white/15 bg-white/[0.06] hover:bg-white/10 text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            Try again
          </button>
        </div>
      )}
      {!error && <Sentinel onHit={next} active={!loading && page < totalPages} />}
    </div>
  )
}

function defaultGrid(items: MediaItem[]) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-6">
      {items.map((item, i) => (
        <div key={`${item.kind}-${item.id}`} className="card-in" style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}>
          <MediaCard item={item} fill />
        </div>
      ))}
    </div>
  )
}

export function Sentinel({ onHit, active }: { onHit: () => void; active: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  // Hold the handler in a ref so the observer effect depends only on `active`.
  // Passing `onHit` directly re-created the IntersectionObserver on every
  // parent render, because the callback is a fresh function each time.
  const handler = useRef(onHit)
  useEffect(() => {
    handler.current = onHit
  }, [onHit])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!active) return
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) handler.current()
    })
    io.observe(el)
    return () => io.disconnect()
  }, [active])

  return <div ref={ref} aria-hidden className="h-24 w-full flex items-center justify-center mt-12" />
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