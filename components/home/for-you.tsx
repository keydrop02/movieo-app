"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"
import { MediaCard } from "@/components/media-card"
import { ScrollRail } from "@/components/scroll-rail"
import { getHistory, type HistoryEntry } from "@/lib/watch-store"
import { readPrefs } from "@/lib/prefs"
import { cx } from "@/lib/utils"
import type { MediaItem } from "@/lib/tmdb/types"

const MAX_SEEDS = 5
const MAX_RESULTS = 22

type SeedKey = string

function yearOf(date: string | null | undefined): string {
  return (date ?? "").slice(0, 4)
}

export function ForYou() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [seeds, setSeeds] = useState<HistoryEntry[]>([])
  const [selected, setSelected] = useState<SeedKey>("")
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const requestId = useRef(0)

  const loadFor = useCallback((key: SeedKey) => {
    const id = ++requestId.current
    const history = getHistory().slice(0, MAX_SEEDS)
    const useKey = key === "" ? (history[0] ? `${history[0].type}:${history[0].id}` : "") : key
    const targets = useKey ? history.filter((h) => `${h.type}:${h.id}` === useKey) : []
    const watched = new Set(getHistory().map((h) => `${h.type}:${h.id}`))
    Promise.all(
      targets.map(async (h) => {
        try {
          const res = await fetch(`/api/detail/${h.type}/${h.id}`)
          if (!res.ok) return []
          const data = (await res.json()) as { similar?: MediaItem[] }
          return data.similar ?? []
        } catch {
          return []
        }
      }),
    ).then((lists) => {
      if (id !== requestId.current) return
      setSeeds(history)
      const seen = new Set<string>()
      const out: MediaItem[] = []
      for (const list of lists) {
        for (const item of list) {
          const k = `${item.kind}:${item.id}`
          if (watched.has(k) || seen.has(k)) continue
          seen.add(k)
          out.push(item)
        }
      }
      setItems(out.slice(0, MAX_RESULTS))
    })
  }, [])

  useEffect(() => {
    if (!readPrefs().showForYou) return
    const history = getHistory().slice(0, MAX_SEEDS)
    if (history.length === 0) return
    loadFor("")
  }, [loadFor])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  if (!readPrefs().showForYou) return null
  if (items.length === 0) return null

  const selectedSeed =
    selected === "" ? seeds[0] : seeds.find((s) => `${s.type}:${s.id}` === selected) ?? seeds[0]
  const selectedLabel = selectedSeed?.title ?? ""

  const select = (key: SeedKey) => {
    setSelected(key)
    setOpen(false)
    loadFor(key)
  }

  return (
    <div className="space-y-2 relative z-10">
      <div className="px-6 lg:px-16">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <h2 className="text-xl lg:text-2xl font-bold text-white/90 shadow-black drop-shadow-md">
            Because you watched
          </h2>
          <div ref={menuRef} className="relative inline-flex items-baseline min-w-0">
            <button
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-haspopup="listbox"
              aria-label="Base recommendations on"
              className="group relative z-40 flex items-center gap-1 max-w-full cursor-pointer outline-none focus:outline-none"
            >
              <span className="text-xl lg:text-2xl font-bold text-white/60 shadow-black drop-shadow-md underline decoration-2 underline-offset-4 decoration-white/40 transition-colors duration-300 group-hover:decoration-white/80 truncate">
                {selectedLabel}
              </span>
              <ChevronDown
                className={cx(
                  "w-5 h-5 text-white/40 group-hover:text-white/80 transition-all duration-300 shrink-0",
                  open && "rotate-180",
                )}
              />
            </button>

            {open && (
              <div
                role="listbox"
                aria-label="Recommendation base"
                className="absolute top-full left-0 mt-2 w-max min-w-[10rem] max-w-[calc(100vw-2rem)] max-h-72 overflow-y-auto surface-nav-drop rounded-xl shadow-2xl py-1 z-[100] animate-dropdown-in"
              >
                {seeds.map((seed) => {
                  const key = `${seed.type}:${seed.id}`
                  const firstKey = seeds[0] ? `${seeds[0].type}:${seeds[0].id}` : ""
                  const isSel = selected === "" ? key === firstKey : selected === key
                  return (
                    <button
                      key={key}
                      type="button"
                      role="option"
                      aria-selected={isSel}
                      onClick={() => select(key)}
                      className={cx(
                        "relative z-[101] w-full text-left px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer flex items-center gap-3",
                        isSel ? "text-white bg-white/5" : "text-white/70 hover:text-white hover:bg-white/10",
                      )}
                    >
                      <span className="truncate">{seed.title}</span>
                      {yearOf(seed.release_date) ? (
                        <span className="text-xs text-white/40 shrink-0">{yearOf(seed.release_date)}</span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      <ScrollRail mask className="pt-2 pb-3 gap-4 px-6 lg:px-16 min-h-0">
        {items.map((item) => (
          <MediaCard key={`${item.kind}-${item.id}`} item={item} />
        ))}
      </ScrollRail>
    </div>
  )
}