"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Play, RotateCcw } from "lucide-react"
import { FilterDropdown, type DropOption } from "@/components/filter-dropdown"
import { MediaCard, SpotlightCard } from "@/components/media-card"
import type { MediaItem } from "@/lib/tmdb/types"
import { cx, mediaUrl } from "@/lib/utils"

const COUNTRIES = [
  "United States", "United Kingdom", "Japan", "South Korea", "India", "France", "Spain", "Germany", "Italy", "Canada",
  "Australia", "China", "Hong Kong", "Taiwan", "Mexico", "Brazil", "Argentina", "Turkey", "Russia", "Sweden", "Denmark",
  "Norway", "Netherlands", "Belgium", "Ireland", "Poland", "Thailand", "Philippines", "Indonesia", "New Zealand", "South Africa",
]

export function ExploreGrid({
  kind,
  genres,
  providers,
  initialItems,
  initialTotalPages,
  spotlight,
  randomLabel,
}: {
  kind: "movie" | "tv"
  genres: Array<{ id: number; name: string }>
  providers: Array<{ id: number; name: string; logo_path: string }>
  initialItems: MediaItem[]
  initialTotalPages: number
  spotlight: MediaItem[]
  randomLabel: string
}) {
  const yearNow = new Date().getFullYear()
  const years: DropOption<string>[] = [
    { value: "all years", label: "All Years" },
    ...[...Array(yearNow - 1949)]
      .map((_, i) => yearNow - i)
      .map((y) => ({ value: String(y), label: String(y) })),
  ]

  const [genre, setGenre] = useState<string>("all genres")
  const [yearSel, setYearSel] = useState<string>("all years")
  const [sort, setSort] = useState<string>("popular")
  const [providerSel, setProviderSel] = useState<string>("all providers")
  const [country, setCountry] = useState<string>("all countries")
  const [items, setItems] = useState(initialItems)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const skipReset = useRef(false)

  const fetchPage = async (p: number, replace: boolean) => {
    setLoading(true)
    try {
      const sp = new URLSearchParams({
        kind,
        page: String(p),
      })
      if (genre !== "all genres") sp.set("genre", genre)
      if (yearSel !== "all years") sp.set("year", yearSel)
      if (providerSel !== "all providers") sp.set("provider", providerSel)
      if (country !== "all countries") sp.set("country", country)
      if (sort !== "popular") sp.set("sort", sort)
      const res = await fetch(`/api/discover?${sp}`)
      const data = await res.json()
      setItems((prev) => {
        if (replace) return data.items
        const seen = new Set(prev.map((x) => x.id))
        return [...prev, ...data.items.filter((x: MediaItem) => !seen.has(x.id))]
      })
      setTotalPages(data.totalPages ?? 1)
      setPage(p)
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading && page < totalPages) {
        fetchPage(page + 1, false)
      }
    })
    io.observe(el)
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, totalPages, loading])

  const applyFilter = (fn: () => void) => {
    fn()
    skipReset.current = true
  }

  useEffect(() => {
    if (!skipReset.current) return
    skipReset.current = false
    fetchPage(1, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genre, yearSel, sort, providerSel, country])

  const genreOptions: DropOption<string>[] = [
    { value: "all genres", label: "All Genres" },
    ...genres.map((g) => ({ value: String(g.id), label: g.name })),
  ]
  const providerOptions: DropOption<string>[] = [
    { value: "all providers", label: "All Providers" },
    ...providers.map((p) => ({
      value: String(p.id),
      label: p.name,
      logoPath: p.logo_path,
    })),
  ]
  const countryOptions: DropOption<string>[] = [
    { value: "all countries", label: "All Countries" },
    ...COUNTRIES.map((c) => ({ value: c, label: c })),
  ]

  const hasActiveFilters =
    genre !== "all genres" ||
    yearSel !== "all years" ||
    sort !== "popular" ||
    providerSel !== "all providers" ||
    country !== "all countries"

  return (
    <div className="min-h-screen text-white relative">
      <div className="relative z-10 pt-24 pb-20 px-6 lg:px-16">
        <div className="mx-auto max-w-[1600px]">
          <div className="relative pt-10 pb-8 space-y-8">
            <div className="relative z-10 flex flex-col gap-6 items-start justify-between">
              <div className="space-y-4 max-w-2xl">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white drop-shadow-lg">
                  {kind === "movie" ? "Movies" : "TV Series"}
                </h1>
                <p className="text-lg text-white/70 font-medium leading-relaxed max-w-xl">
                  {kind === "movie" ? "Discover new movies to watch" : "Discover new TV series to watch"}
                </p>
              </div>
              <div className="w-full space-y-3">
                <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full">
                <FilterDropdown
                  options={genreOptions}
                  selected={genre}
                  onSelect={(v) => applyFilter(() => setGenre(v))}
                  label="Genre"
                  triggerClass="w-auto flex-none md:min-w-[140px]"
                />
                <FilterDropdown
                  options={years}
                  selected={yearSel}
                  onSelect={(v) => applyFilter(() => setYearSel(v))}
                  label="Year"
                  triggerClass="w-auto flex-none md:min-w-[140px]"
                />
                <FilterDropdown
                  options={[
                    { value: "popular", label: "Popular" },
                    { value: "rating", label: "Top Rated" },
                    { value: "voted", label: "Most Voted" },
                    { value: "newest", label: "Newest" },
                    { value: "oldest", label: "Oldest" },
                    { value: "title-az", label: "Title (A-Z)" },
                  ]}
                  selected={sort}
                  onSelect={(v) => applyFilter(() => setSort(v))}
                  label="Sort"
                  triggerClass="w-auto flex-none md:min-w-[140px]"
                />
                <FilterDropdown
                  options={providerOptions}
                  selected={providerSel}
                  onSelect={(v) => applyFilter(() => setProviderSel(v))}
                  label="Provider"
                  triggerClass="w-auto flex-none md:min-w-[140px]"
                />
                <FilterDropdown
                  options={countryOptions}
                  selected={country}
                  onSelect={(v) => applyFilter(() => setCountry(v))}
                  label="Country"
                  triggerClass="w-auto flex-none md:min-w-[140px]"
                />
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={() =>
                      applyFilter(() => {
                        setGenre("all genres")
                        setYearSel("all years")
                        setSort("popular")
                        setProviderSel("all providers")
                        setCountry("all countries")
                      })
                    }
                    className="flex items-center gap-1.5 h-10 px-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-white text-sm font-medium transition-all shrink-0"
                  >
                    <RotateCcw className="w-4 h-4 text-white/70" />
                    Reset
                  </button>
                )}
                <div className="hidden md:flex ml-auto">
                  <RandomButton
                    label={randomLabel}
                    kind={kind}
                    filters={{ genre, year: yearSel, provider: providerSel, country, sort }}
                  />
                </div>
              </div>
              <div className="flex md:hidden w-full justify-start">
                <RandomButton
                  label={randomLabel}
                  kind={kind}
                  filters={{ genre, year: yearSel, provider: providerSel, country, sort }}
                />
              </div>
            </div>
          </div>

            {spotlight.length > 0 && (
              <div className="mt-2 mb-1">
                <div className="space-y-4 relative z-0 group/row">
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-white/90 drop-shadow-md">
                      {kind === "movie" ? "Upcoming" : "New Seasons Airing"}
                    </h2>
                  </div>
                  <div className="relative">
                    <button aria-label="Scroll left" className="hidden lg:flex absolute -left-2 top-1/2 -translate-y-1/2 z-[60] w-12 h-12 bg-transparent drop-shadow-lg transition-all duration-300 items-center justify-center hover:scale-110 cursor-pointer opacity-0 pointer-events-none">
                      <Play className="w-10 h-10 text-white drop-shadow-md -scale-x-100" />
                    </button>
                    <div
                      className="flex gap-3 sm:gap-4 overflow-x-auto overflow-y-clip pt-4 pb-0 sm:pb-12 scrollbar-hide items-start isolate"
                      style={{
                        maskImage: "linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)",
                        WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)",
                      }}
                    >
                      {spotlight.map((item) => (
                        <SpotlightCard
                          key={item.id}
                          item={item}
                          badge={kind === "movie" ? "Coming Soon" : `Season ${item.vote_count ? "3" : "4"}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4">
              <div className={cx("grid grid-cols-1 grid-rows-1", error && "opacity-50")}>
                <div className="col-start-1 row-start-1 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-6 sm:gap-y-6">
                  {items.map((item, i) => (
                    <div key={item.id} className="card-in" style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}>
                      <MediaCard item={item} fill />
                    </div>
                  ))}
                </div>
              </div>
              {loading && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-12 pt-8">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="animate-pulse aspect-[2/3] rounded-xl bg-white/[0.06]" />
                  ))}
                </div>
              )}
            </div>

            <div ref={sentinelRef} className="h-24 w-full flex items-center justify-center mt-12" />
          </div>
        </div>
      </div>
    </div>
  )
}

function RandomButton({
  label,
  kind,
  filters,
}: {
  label: string
  kind: "movie" | "tv"
  filters: { genre: string; year: string; provider: string; country: string; sort: string }
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const surprise = async () => {
    if (busy) return
    setBusy(true)
    try {
      const sp = new URLSearchParams({ kind })
      if (filters.genre !== "all genres") sp.set("genre", filters.genre)
      if (filters.year !== "all years") sp.set("year", filters.year)
      if (filters.provider !== "all providers") sp.set("provider", filters.provider)
      if (filters.country !== "all countries") sp.set("country", filters.country)
      if (filters.sort !== "popular") sp.set("sort", filters.sort)
      const res = await fetch(`/api/discover?${sp}`)
      const data = await res.json()
      const items: MediaItem[] = data.items ?? []
      if (!items.length) return
      const item = items[Math.floor(Math.random() * items.length)]
      router.push(mediaUrl(item))
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={surprise}
      aria-label={label}
      className="flex items-center gap-2 h-[38px] px-4 shrink-0 theme-btn-primary border border-white/10 rounded-full transition-colors duration-300 group"
    >
      <span className="text-sm font-semibold whitespace-nowrap">Surprise Me</span>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className={cx("w-4 h-4 shrink-0", busy && "animate-spin")} fill="currentColor">
        <path d="M467.8 98.4C479.8 93.4 493.5 96.2 502.7 105.3L566.7 169.3C572.7 175.3 576.1 183.4 576.1 191.9C576.1 200.4 572.7 208.5 566.7 214.5L502.7 278.5C493.5 287.7 479.8 290.4 467.8 285.4C455.8 280.4 448 268.9 448 256L448 224L416 224C405.9 224 396.4 228.7 390.4 236.8L358 280L318 226.7L339.2 198.4C357.3 174.2 385.8 160 416 160L448 160L448 128C448 115.1 455.8 103.4 467.8 98.4zM218 360L258 413.3L236.8 441.6C218.7 465.8 190.2 480 160 480L96 480C78.3 480 64 465.7 64 448C64 430.3 78.3 416 96 416L160 416C170.1 416 179.6 411.3 185.6 403.2L218 360zM502.6 534.6C493.4 543.8 479.7 546.5 467.7 541.5C455.7 536.5 448 524.9 448 512L448 480L416 480C385.8 480 357.3 465.8 339.2 441.6L185.6 236.8C179.6 228.7 170.1 224 160 224L96 224C78.3 224 64 209.7 64 192C64 174.3 78.3 160 96 160L160 160C190.2 160 218.7 174.2 236.8 198.4L390.4 403.2C396.4 411.3 405.9 416 416 416L448 416L448 384C448 371.1 455.8 359.4 467.8 354.4C479.8 349.4 493.5 352.2 502.7 361.3L566.7 425.3C572.7 431.3 576.1 439.4 576.1 447.9C576.1 456.4 572.7 464.5 566.7 470.5L502.7 534.5z" />
      </svg>
    </button>
  )
}