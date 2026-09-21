"use client"

import { useEffect, useRef, useState } from "react"
import { Search } from "lucide-react"
import { MediaCard } from "@/components/media-card"
import { GridSkeletons } from "@/components/skeleton"
import type { MediaItem } from "@/lib/tmdb/types"

export function SearchView({ trending }: { trending: MediaItem[] }) {
  const [q, setQ] = useState("")
  const [items, setItems] = useState<MediaItem[]>([])
  const [focused, setFocused] = useState(false)
  const [fetching, setFetching] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    const query = q.trim()
    if (!query) {
      timer.current = setTimeout(() => {
        setItems([])
        setFetching(false)
      }, 0)
      return
    }
    timer.current = setTimeout(async () => {
      setFetching(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setItems(data.items ?? [])
      } catch {
        setItems([])
      } finally {
        setFetching(false)
      }
    }, 250)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [q])

  const searching = q.trim().length > 0

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
              <div className="relative flex items-center w-full h-12 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-300 focus-within:bg-white/10 focus-within:border-white/20 focus-within:shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                <div className="pl-5 text-white/40">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="Search for movies & TV shows..."
                  className="w-full h-full bg-transparent border-none outline-none text-white text-base placeholder:text-white/30 px-4 font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {searching && (
          <div className="w-full max-w-[1600px] mt-8 pb-20">
            <div className="mb-4 sm:mb-6">
              <h2 className="text-lg md:text-xl font-semibold text-white/70 tracking-tight">
                Results for &ldquo;{q.trim()}&rdquo;
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
              {fetching && items.length === 0 ? (
                <div className="col-span-full">
                  <GridSkeletons count={12} />
                </div>
              ) : (
                items.map((item, i) => (
                  <div key={item.id} className="card-in" style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}>
                    <MediaCard item={item} fill />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {!searching && (
          <div className="w-full max-w-[1600px] pb-20 -mt-4">
            <div className="text-center mb-6">
              <h2 className="text-lg md:text-xl font-semibold text-white/70 tracking-tight">Trending Today</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
              {trending.map((item, i) => (
                <div key={item.id} className="card-in" style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}>
                  <MediaCard item={item} fill />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}