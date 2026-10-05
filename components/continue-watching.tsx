"use client"

import { useState } from "react"
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

export function ContinueWatching() {
  const [cards, setCards] = useState<Card[]>(() => (typeof window === "undefined" ? [] : buildCards()))

  const remove = (card: Card) => {
    removeFromHistory(card.entry.id, card.entry.type)
    removeProgressFor(card.entry.id, card.entry.type)
    markProgressPurged(card.entry.id, card.entry.type)
    setCards(buildCards())
  }

  if (cards.length === 0) return null

  return (
    <div className="space-y-2 relative z-10">
      <div className="px-6 lg:px-16">
        <RowHeader title="Continue Watching" />
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