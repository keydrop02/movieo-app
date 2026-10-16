"use client"

import { useMemo, useState } from "react"
import { Clock } from "lucide-react"
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
import { useStoredValue } from "@/lib/use-local-store"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { TrashCan } from "@/components/trash-can"
import { cx } from "@/lib/utils"
import { WatchHistoryCard } from "@/components/watch-history-card"

const EMPTY_HISTORY: HistoryEntry[] = []

export function HistoryView() {
const [filter, setFilter] = useState<"all" | "movie" | "tv">("all")

  const [entries, invalidateHistory] = useStoredValue(getHistory, EMPTY_HISTORY)
  const [confirming, setConfirming] = useState(false)
  const rows = useMemo(
    () => (filter === "all" ? entries : entries.filter((e) => e.type === filter)),
    [entries, filter],
  )

  const clear = () => {
    clearHistory()
    clearProgress()
    clearAllPurges()
    invalidateHistory()
    setConfirming(false)
  }

  const remove = (id: number, type: "movie" | "tv") => {
    removeFromHistory(id, type)
    removeProgressFor(id, type)
    markProgressPurged(id, type)
    invalidateHistory()
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
            <TrashCan />
            Clear all
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="surface-panel mt-10 px-8 py-14 text-center">
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

      <ConfirmDialog
        open={confirming}
        title="Clear watch history?"
        body="This will permanently remove all watched entries and their progress. This can't be undone."
        confirmLabel="Clear all"
        onConfirm={clear}
        onCancel={() => setConfirming(false)}
      />
    </div>
  )
}