"use client"

import { useRef, useState } from "react"
import { RowHeader, RowScrollButton } from "@/components/rows"
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

const MASK = "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)"

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
  const trackRef = useRef<HTMLDivElement>(null)
  const [cards, setCards] = useState<Card[]>(() => (typeof window === "undefined" ? [] : buildCards()))
  const [canRight, setCanRight] = useState(true)
  const [canLeft, setCanLeft] = useState(false)

  const onScroll = () => {
    const el = trackRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 4)
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }

  const remove = (card: Card) => {
    removeFromHistory(card.entry.id, card.entry.type)
    removeProgressFor(card.entry.id, card.entry.type)
    markProgressPurged(card.entry.id, card.entry.type)
    setCards(buildCards())
  }

  if (cards.length === 0) return null

  return (
    <div className="space-y-2 relative z-10 group/row">
      <div className="px-6 lg:px-16">
        <RowHeader title="Continue Watching" />
      </div>
      <div className="relative">
        <RowScrollButton side="left" visible={canLeft} onClick={() => trackRef.current?.scrollBy({ left: -trackRef.current.clientWidth * 0.8, behavior: "smooth" })} />
        <RowScrollButton side="right" visible={canRight} onClick={() => trackRef.current?.scrollBy({ left: trackRef.current.clientWidth * 0.8, behavior: "smooth" })} />
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="flex overflow-x-auto overflow-y-clip pt-2 px-6 lg:px-16 gap-4 scrollbar-hide items-start lg:min-h-[216px]"
          style={{ maskImage: MASK, WebkitMaskImage: MASK }}
        >
          {cards.map((card) => (
            <div key={`${card.entry.type}-${card.entry.id}`} className="flex-none w-[240px] sm:w-[280px] lg:w-[340px]">
              <WatchHistoryCard entry={card.entry} progress={card.progress} onRemove={() => remove(card)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}