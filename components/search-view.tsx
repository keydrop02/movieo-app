"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronDown, Clock, Search, X } from "lucide-react"
import { MediaCard } from "@/components/media-card"
import { GridSkeletons } from "@/components/skeleton"
import { cx } from "@/lib/utils"
import { reportError } from "@/lib/error-reporting"
import { addRecentSearch, clearRecentSearches, getRecentSearches, removeRecentSearch } from "@/lib/search-history"
import { readPrefs } from "@/lib/prefs"
import type { MediaItem, TrendingWindow } from "@/lib/tmdb/types"

const TREND_WINDOWS: Array<{ id: TrendingWindow; label: string }> = [
  { id: "day", label: "Today" },
  { id: "week", label: "This Week" },
]

function SearchMessage({ title, body }: { title: string; body: string }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center gap-2 py-20 text-center" role="status">
      <p className="text-white/90 text-lg font-semibold">{title}</p>
      <p className="text-white/55 text-sm max-w-md">{body}</p>
    </div>
  )
}

export function SearchView({ trending }: { trending: MediaItem[] }) {
  const [q, setQ] = useState("")
  const [items, setItems] = useState<MediaItem[]>([])
  const [focused, setFocused] = useState(false)
  const [fetching, setFetching] = useState(false)
  /** Set when the request itself failed, so "broken" is not shown as "no results". */
  const [searchFailed, setSearchFailed] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** Monotonic id; only the newest request is allowed to write results. */
  const requestId = useRef(0)
  const inFlight = useRef<AbortController | null>(null)

  const [timeWindow, setTimeWindow] = useState<TrendingWindow>("week")
  const [recents, setRecents] = useState<string[]>([])
  /**
   * One entry per window. `failed` lives in the cache rather than in its own
   * flag so the fetch effect never has to clear state synchronously before
   * starting a request.
   */
  const [trendCache, setTrendCache] = useState<Partial<Record<TrendingWindow, { items: MediaItem[]; failed: boolean }>>>(
    { week: { items: trending, failed: false } },
  )
  const [trendLoading, setTrendLoading] = useState(false)
  const [trendOpen, setTrendOpen] = useState(false)
  const trendRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!trendOpen) return
    const onClick = (e: MouseEvent) => {
      if (trendRef.current && !trendRef.current.contains(e.target as Node)) setTrendOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTrendOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [trendOpen])

  useEffect(() => {
    if (trendCache[timeWindow] !== undefined) return
    let cancelled = false
    // No synchronous setState here: the cache entry itself records both success
    // and failure, so the effect only writes state from a promise callback.
    fetch(`/api/trending?window=${timeWindow}`)
      .then((r) => {
        if (!r.ok) throw new Error(`trending ${r.status}`)
        return r.json()
      })
      .then((data: { items?: MediaItem[] }) => {
        if (cancelled) return
        setTrendCache((prev) => ({ ...prev, [timeWindow]: { items: data.items ?? [], failed: false } }))
      })
      .catch((err) => {
        if (cancelled) return
        setTrendCache((prev) => ({ ...prev, [timeWindow]: { items: [], failed: true } }))
        reportError("search.trending", err, "warn")
      })
      .finally(() => {
        if (!cancelled) setTrendLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [timeWindow, trendCache])

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    const query = q.trim()

    // Even the teardown path is deferred onto a timer. Clearing state directly
    // in the effect body forces a synchronous second render pass; the empty
    // branch has no I/O to wait for, so a zero-delay task is equivalent from the
    // user's perspective and keeps the effect free of cascading renders.
    timer.current = setTimeout(async () => {
      if (!query) {
        requestId.current++
        inFlight.current?.abort()
        inFlight.current = null
        setItems([])
        setFetching(false)
        setSearchFailed(false)
        return
      }

      // Cancel the previous query outright and tag this one, so a slow earlier
      // response can never overwrite the results for what the user is currently
      // looking at.
      inFlight.current?.abort()
      const controller = new AbortController()
      inFlight.current = controller
      const id = ++requestId.current
      const isStale = () => id !== requestId.current

      setFetching(true)
      setSearchFailed(false)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        if (!res.ok) throw new Error(`search ${res.status}`)
        const data: { items?: MediaItem[] } = await res.json()
        if (isStale()) return
        setItems(data.items ?? [])
        if ((data.items?.length ?? 0) > 0 && readPrefs().rememberRecentSearches) {
          addRecentSearch(query)
          setRecents(getRecentSearches())
        }
      } catch (err) {
        if (isStale()) return
        // An abort is our own doing, not a failure to report.
        if (err instanceof DOMException && err.name === "AbortError") return
        setItems([])
        setSearchFailed(true)
        reportError("search.query", err)
      } finally {
        if (!isStale()) setFetching(false)
      }
    }, 250)

    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [q])

  const searching = q.trim().length > 0

  const trendEntry = trendCache[timeWindow]
  const trendItems = trendEntry?.items ?? []
  const trendFailed = trendEntry?.failed ?? false

  function onSelectWindow(next: TrendingWindow) {
    setTimeWindow(next)
    setTrendOpen(false)
    if (!trendCache[next]) setTrendLoading(true)
  }

  return (
    <div className="min-h-screen w-full relative">
      <div className={`fixed inset-0 z-0 opacity-60 pointer-events-none transition-opacity duration-500 ${focused || searching ? "opacity-40" : ""}`}>
        <div className="absolute inset-0 aero-bg" aria-hidden />
      </div>
      <div className="relative z-10 w-full min-h-screen pt-32 px-6 lg:px-16 flex flex-col items-center justify-start gap-8">
        <div className="w-full max-w-3xl flex flex-col items-center gap-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tight drop-shadow-xl">
              What do you feel like watching?
            </h1>
          </div>

          <div className="w-full relative group max-w-xl">
            <div className="relative w-full transition-all duration-300 transform group-focus-within:scale-[1.02]">
              <div className="relative flex items-center w-full h-12 rounded-full bg-[#18181b] border border-[#202023] shadow-2xl transition-all duration-300 focus-within:bg-[#1c1c1f] focus-within:border-[#2c2c2f] focus-within:shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                <div className="pl-5 text-white/40">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="search"
                  role="searchbox"
                  aria-label="Search for movies and TV shows"
                  enterKeyHint="search"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="Search for movies & TV shows..."
                  className="w-full h-full bg-transparent border-none outline-none text-white text-base placeholder:text-white/55 px-4 font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-[1600px] mt-8 pb-20">
          {!searching && recents.length > 0 && (
            <>
              <div className="max-w-3xl mx-auto flex items-center gap-2 flex-wrap justify-center">
                {recents.map((term) => (
                  <div
                    key={term}
                    role="button"
                    tabIndex={0}
                    onClick={() => setQ(term)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        setQ(term)
                      }
                    }}
                    className="group inline-flex items-center gap-1 h-8 pl-3 pr-1 rounded-full bg-white/[0.06] border border-white/10 text-white/80 hover:bg-white/10 hover:text-white text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Clock className="w-3 h-3 text-white/35" />
                    <span>{term}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeRecentSearch(term)
                        setRecents(getRecentSearches())
                      }}
                      aria-label={`Remove ${term}`}
                      className="flex items-center justify-center w-5 h-5 rounded-full text-white/40 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    clearRecentSearches()
                    setRecents([])
                  }}
                  className="inline-flex items-center gap-1 h-8 px-3 rounded-full text-white/40 hover:text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>
              <div className="mb-6" />
            </>
          )}
          <div className="mb-4 sm:mb-6 text-center">
            <h2 className="text-lg lg:text-xl font-semibold text-white">
              {searching ? (
                <span>Results for &ldquo;{q.trim()}&rdquo;</span>
              ) : (
                <div className="inline-flex items-baseline gap-2">
                  <span className="shrink-0">Trending</span>
                  <div ref={trendRef} className="relative min-w-0 inline-flex items-baseline">
                    <button
                      type="button"
                      onClick={() => setTrendOpen((v) => !v)}
                      aria-expanded={trendOpen}
                      aria-haspopup="listbox"
                      aria-label="Trending time window"
                      disabled={trendLoading}
                      className={cx(
                        "group relative z-40 flex items-center gap-1 max-w-full cursor-pointer outline-none focus:outline-none",
                        trendLoading && "cursor-not-allowed opacity-60",
                      )}
                    >
                      <span className="underline decoration-2 underline-offset-4 decoration-white/40 transition-colors duration-300 group-hover:decoration-white/80 truncate">
                        {TREND_WINDOWS.find((w) => w.id === timeWindow)?.label}
                      </span>
                      <ChevronDown
                        className={cx(
                          "w-5 h-5 text-white/50 group-hover:text-white transition-all duration-300 shrink-0",
                          trendOpen && "rotate-180",
                        )}
                      />
                    </button>

                  {trendOpen && (
                      <div
                        role="listbox"
                        className="absolute top-full left-0 mt-2 w-max min-w-[8.5rem] max-w-[calc(100vw-2rem)] max-h-72 overflow-y-auto surface-nav-drop rounded-xl shadow-2xl py-1 z-[100] animate-dropdown-in"
                      >
                        {TREND_WINDOWS.map((w) => {
                          const isSel = w.id === timeWindow
                          return (
                            <button
                              key={w.id}
                              type="button"
                              role="option"
                              aria-selected={isSel}
                              onClick={() => onSelectWindow(w.id)}
                              className={cx(
                                "relative z-[101] w-full text-left px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer flex items-center gap-3",
                                isSel ? "text-white bg-white/5" : "text-white/70 hover:text-white hover:bg-white/10",
                              )}
                            >
                              <span className="truncate">{w.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
            {searching ? (
              searchFailed && items.length === 0 ? (
                <SearchMessage
                  title="Search is unavailable"
                  body="We couldn't reach the search service. Please check your connection and try again."
                />
              ) : fetching && items.length === 0 ? (
                <div className="col-span-full">
                  <GridSkeletons count={60} />
                </div>
              ) : items.length === 0 && !fetching ? (
                <SearchMessage
                  title={`No results for "${q.trim()}"`}
                  body="Try a different spelling, or search for a title, actor, or director."
                />
              ) : (
                items.map((item, i) => (
                  <div key={`${item.kind}-${item.id}`} className="card-in" style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}>
                    <MediaCard item={item} fill />
                  </div>
                ))
              )
            ) : trendFailed && trendItems.length === 0 ? (
              <SearchMessage title="Trending is unavailable" body="We couldn't load trending titles right now." />
            ) : trendLoading && trendItems.length === 0 ? (
              <div className="col-span-full">
                <GridSkeletons count={18} />
              </div>
            ) : (
              trendItems.map((item, i) => (
                <div key={`${item.kind}-${item.id}`} className="card-in" style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}>
                  <MediaCard item={item} fill />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}