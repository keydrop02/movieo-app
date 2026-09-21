"use client"

import { useState } from "react"
import { MediaCard } from "@/components/media-card"
import { ProviderSegmented } from "@/components/grid-pages"
import type { MediaItem } from "@/lib/tmdb/types"

export function Filmography({ credits }: { credits: Array<MediaItem & { role?: string }> }) {
  const [kind, setKind] = useState<"movie" | "tv">("movie")
  const list = credits.filter((c) => c.kind === kind)

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 px-2">
        <h2 className="text-xl lg:text-2xl font-bold text-white/90">Filmography</h2>
        <ProviderSegmented kind={kind} onChange={setKind} />
      </div>
      {list.length ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-5 gap-y-5">
          {list.slice(0, 60).map((item, i) => (
            <div key={`${item.kind}-${item.id}`} className="card-in" style={{ animationDelay: `${Math.min(i, 20) * 35}ms` }}>
              <MediaCard item={item} fill />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-white/40 px-2">No credits in this category.</p>
      )}
    </div>
  )
}