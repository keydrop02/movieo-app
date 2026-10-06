"use client"

import { useCallback, useSyncExternalStore } from "react"
import { RowHeader } from "@/components/rows"
import { ScrollRail } from "@/components/scroll-rail"
import { WatchHistoryCard } from "@/components/watch-history-card"
import {
  getAllProgress,
  getHistory,
  markProgressPurged,
  removeFromHistory,
  removeProgressFor,
  type Progress,
} from "@/lib/watch-store"
import type { HistoryEntry } from "@/lib/watch-store"
import { readPrefs } from "@/lib/prefs"

type Card = { entry: HistoryEntry; progress: Progress }

function buildCards(): Card[] {
  const history = getHistory()
  const all = getAllProgress()
  const cards: Card[] = []
  for (const entry of history) {
    let progress: Progress | undefined
    if (entry.type === "tv") {
      const prefix = `tv:${entry.id}:`
      const eps = Object.entries(all)
        .filter(([key, p]) => key.startsWith(prefix) && !p.completed)
        .sort((a, b) => (b[1].lastUpdated ?? "").localeCompare(a[1].lastUpdated ?? ""))
      progress = eps[0]?.[1]
    } else {
      progress = all[`movie:${entry.id}`]
    }
    if (!progress || progress.completed) continue
    cards.push({ entry, progress })
  }
  cards.sort((a, b) => (b.progress.lastUpdated ?? "").localeCompare(a.progress.lastUpdated ?? ""))
  return cards
}

/**
 * localStorage-backed store exposed through `useSyncExternalStore`.
 *
 * This component previously seeded state from localStorage in a `useState`
 * initializer, which meant the server rendered `null` while the client's first
 * render produced the rail. Those two trees cannot be reconciled, and the
 * mismatch hit exactly the users who had watch history.
 *
 * `useSyncExternalStore` handles this properly: the server snapshot is always
 * empty, and React re-reads after hydration, so both trees match on first paint.
 */
const EMPTY: Card[] = []
let cached: Card[] | null = null
const listeners = new Set<() => void>()

function getSnapshot(): Card[] {
  // Cache by reference so the snapshot is referentially stable between reads.
  // Without this, `useSyncExternalStore` would loop forever on a fresh array.
  if (cached === null) cached = buildCards()
  return cached
}

function getServerSnapshot(): Card[] {
  return EMPTY
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  // Keys are `movieo:history`, `movieo:progress`, `movieo:purged`; `e.key` is
  // null on a `clear()`, which also invalidates us.
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key.startsWith("movieo:")) {
      cached = null
      listener()
    }
  }
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", onStorage)
  }
}

function invalidate() {
  cached = null
  for (const listener of listeners) listener()
}

export function ContinueWatching() {
  const cards = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const remove = useCallback(
    (card: Card) => {
      removeFromHistory(card.entry.id, card.entry.type)
      removeProgressFor(card.entry.id, card.entry.type)
      markProgressPurged(card.entry.id, card.entry.type)
      invalidate()
    },
    [],
  )

  if (!readPrefs().showContinueWatching) return null
  if (cards.length === 0) return null

  return (
    <div className="space-y-2 relative z-10">
      <div className="px-6 lg:px-16">
        <RowHeader title="Continue Watching" href="/watch-history" />
      </div>
      <ScrollRail mask className="pt-2 px-6 lg:px-16 gap-4 lg:min-h-[216px]">
        {cards.map((card) => (
          <div key={`${card.entry.type}-${card.entry.id}`} className="flex-none w-[240px] sm:w-[280px] lg:w-[340px]">
            <WatchHistoryCard entry={card.entry} progress={card.progress} onRemove={() => remove(card)} />
          </div>
        ))}
      </ScrollRail>
    </div>
  )
}
