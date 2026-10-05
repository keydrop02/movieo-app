"use client"

import { MediaCard, ProviderTile } from "@/components/media-card"
import { ScrollRail } from "@/components/scroll-rail"
import type { MediaItem } from "@/lib/tmdb/types"
import { cx } from "@/lib/utils"

export function RowHeader({
  title,
  titleClass = "text-xl lg:text-2xl font-semibold text-white/90 shadow-black drop-shadow-md",
}: {
  title: string
  titleClass?: string
}) {
  return (
    <div className={cx("flex items-center justify-between", "space-y-0")}>
      <h2 className={cx("transition-all duration-300", titleClass)}>{title}</h2>
    </div>
  )
}

export function PosterRow({
  items,
  header,
  mask = true,
  padClass = "px-6 lg:px-16",
  minH = "min-h-0",
  gap = "gap-4",
}: {
  items: MediaItem[]
  header?: { title: string }
  mask?: boolean
  padClass?: string
  minH?: string
  gap?: string
}) {
  return (
    <div className="space-y-2 relative z-10">
      {header && (
        <div className="px-6 lg:px-16">
          <RowHeader title={header.title} />
        </div>
      )}
      <ScrollRail mask={mask} className={cx("pt-2 pb-3", gap, padClass, minH)}>
        {items.map((item) => (
          <MediaCard key={`${item.kind}-${item.id}`} item={item} />
        ))}
      </ScrollRail>
    </div>
  )
}

export function ProviderTileRow({ providers }: { providers: Array<{ id: number; name: string; logo_path: string }> }) {
  return (
    <div className="space-y-4 relative z-10">
      <div className="px-6 lg:px-16">
        <h2 className="text-xl lg:text-2xl font-semibold text-white/90 shadow-black drop-shadow-md">Browse by Provider</h2>
      </div>
      <ScrollRail mask className="gap-5 lg:gap-6 pt-2 px-6 lg:px-16 overflow-y-visible">
        {providers.map((p) => (
          <ProviderTile key={p.id} id={p.id} name={p.name} logoPath={p.logo_path} />
        ))}
      </ScrollRail>
    </div>
  )
}
