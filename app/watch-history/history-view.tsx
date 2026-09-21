"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { AlertTriangle, Clock, X } from "lucide-react"
import {
  clearAllPurges,
  clearHistory,
  clearProgress,
  getHistory,
  removeFromHistory,
  removeProgressFor,
  markProgressPurged,
  type HistoryEntry,
} from "@/lib/watch-store"
import { cx } from "@/lib/utils"
import { WatchHistoryCard } from "@/components/watch-history-card"

export function HistoryView() {
const [filter, setFilter] = useState<"all" | "movie" | "tv">("all")

  const [entries, setEntries] = useState<HistoryEntry[]>(() => getHistory())
  const [confirming, setConfirming] = useState(false)
  const confirmRef = useRef<HTMLDivElement>(null)
  const rows = useMemo(
    () => (filter === "all" ? entries : entries.filter((e) => e.type === filter)),
    [entries, filter],
  )

  const clear = () => {
    clearHistory()
    clearProgress()
    clearAllPurges()
    setEntries([])
    setConfirming(false)
  }

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "movieo:history" || e.key === null) setEntries(getHistory())
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  useEffect(() => {
    if (!confirming) return
    const onClick = (e: MouseEvent) => {
      if (confirmRef.current && !confirmRef.current.contains(e.target as Node)) setConfirming(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setConfirming(false)
    }
    document.addEventListener("mousedown", onClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [confirming])

  const remove = (id: number, type: "movie" | "tv") => {
    removeFromHistory(id, type)
    removeProgressFor(id, type)
    markProgressPurged(id, type)
    setEntries((prev) => prev.filter((e) => !(e.id === id && e.type === type)))
  }

  return (
    <div className="relative z-10 min-h-[60vh] pt-28 px-6 lg:px-16 pb-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Watch History</h1>
          <p className="text-white/45 text-sm mt-2">
            {entries.length === 0 ? "Nothing watched yet." : `Your recently watched movies and shows (${entries.length}).`}
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white/[0.06] ring-1 ring-white/10">
          {(
            [
              { id: "all", label: "All" },
              { id: "movie", label: "Movies" },
              { id: "tv", label: "Series" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={cx(
                "px-4 sm:px-5 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer",
                filter === t.id ? "bg-white text-black" : "text-white/60 hover:text-white",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        {entries.length > 0 && (
          <button
            onClick={() => setConfirming(true)}
            className="flex items-center gap-2 h-9 px-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white/80 hover:text-white text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z"></path></svg>
            Clear all
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="glass-panel mt-10 px-8 py-14 text-center">
          <Clock className="w-8 h-8 text-white/30 mx-auto" />
          <p className="text-white/45 text-sm mt-4">
            {entries.length === 0
              ? "Start watching in the detail pages and your history will show up here."
              : "No entries in this filter."}
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rows.map((entry) => (
            <WatchHistoryCard
              key={`${entry.type}-${entry.id}`}
              entry={entry}
              onRemove={(e) => remove(e.id, e.type)}
            />
          ))}
        </div>
      )}

      {confirming &&
        createPortal(
          <div className="fixed inset-0 z-[160]">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
              ref={confirmRef}
              role="dialog"
              aria-modal="true"
              aria-label="Clear watch history"
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-2rem)] max-w-sm bg-[#141414]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-dropdown-in"
            >
              <div className="flex items-start justify-between gap-3 px-5 pt-5">
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center justify-center w-9 h-9 rounded-full bg-red-500/15 text-red-400 shrink-0">
                    <AlertTriangle className="w-4.5 h-4.5" />
                  </span>
                  <h3 className="text-sm font-semibold text-white/90">Clear watch history?</h3>
                </div>
                <button
                  onClick={() => setConfirming(false)}
                  aria-label="Cancel"
                  className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="px-5 pt-3 text-sm text-white/50 leading-relaxed">
                This will permanently remove all watched entries and their progress. This can&apos;t be undone.
              </p>
              <div className="flex items-center gap-2.5 px-5 pt-5 pb-5">
                <button
                  onClick={() => setConfirming(false)}
                  className="flex-1 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white/80 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={clear}
                  className="flex-1 h-10 rounded-xl bg-[#e50914] hover:bg-[#f6121d] text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Clear all
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}