"use client"

import { useState } from "react"
import { ProviderSegmented, GridWithFetch } from "@/components/grid-pages"
import type { MediaItem } from "@/lib/tmdb/types"

export function ProviderExplorer({
  providerId,
  initialItems,
  initialTotalPages,
}: {
  providerId: number
  initialItems: MediaItem[]
  initialTotalPages: number
}) {
  const [kind, setKind] = useState<"movie" | "tv">("movie")
  const [movie] = useState<{ items: MediaItem[]; totalPages: number }>({ items: initialItems, totalPages: initialTotalPages })
  const [tv, setTv] = useState<{ items: MediaItem[]; totalPages: number } | null>(null)

  const loadTv = async () => {
    if (tv) {
      setKind("tv")
      return
    }
    try {
      const res = await fetch(`/api/discover?kind=tv&provider=${providerId}`)
      const data = await res.json()
      setTv({ items: data.items ?? [], totalPages: data.totalPages ?? 1 })
      setKind("tv")
    } catch {
      setKind("tv")
    }
  }

  const data = kind === "movie" ? movie : tv
  const query = `kind=${kind}&provider=${providerId}`

  return (
    <>
      <div className="mb-8">
        <ProviderSegmented kind={kind} onChange={(k) => (k === "tv" ? loadTv() : setKind("movie"))} />
      </div>
      <div>
        {data ? (
          <GridWithFetch key={query} query={query} initialItems={data.items} initialTotalPages={data.totalPages} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse aspect-[2/3] rounded-xl bg-white/[0.06]" />
            ))}
          </div>
        )}
      </div>
    </>
  )
}