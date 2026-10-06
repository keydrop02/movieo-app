"use client"

import Link from "next/link"
import { MediaCard, ProviderTile } from "@/components/media-card"
import { ScrollRail } from "@/components/scroll-rail"
import type { MediaItem } from "@/lib/tmdb/types"
import { cx } from "@/lib/utils"

export function RowHeader({
  title,
  titleClass = "text-xl lg:text-2xl font-bold text-white/90 shadow-black drop-shadow-md",
  href,
}: {
  title: string
  titleClass?: string
  href?: string
}) {
  return (
    <div className={cx("flex items-center justify-between", "space-y-0")}>
      <h2 className={cx("flex items-center gap-2.5 transition-all duration-300", titleClass)}>
        {title}
        {href && (
          <Link
            href={href}
            aria-label={`${title} - view history`}
            className="inline-flex h-[1.2em] w-[1.2em] items-center justify-center text-white/60 transition-colors hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              aria-hidden="true"
              className="size-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
            </svg>
          </Link>
        )}
      </h2>
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
        <h2 className="text-xl lg:text-2xl font-bold text-white/90 shadow-black drop-shadow-md">Browse by Provider</h2>
      </div>
      <ScrollRail mask className="gap-5 lg:gap-6 pt-2 px-6 lg:px-16 overflow-y-visible">
        {providers.map((p) => (
          <ProviderTile key={p.id} id={p.id} name={p.name} logoPath={p.logo_path} />
        ))}
      </ScrollRail>
    </div>
  )
}
