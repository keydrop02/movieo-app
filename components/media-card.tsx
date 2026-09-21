import Link from "next/link"
import { Play } from "lucide-react"
import { mediaUrl, year, rateColor } from "@/lib/utils"
import { poster, backdrop, img } from "@/lib/tmdb/images"
import type { MediaItem } from "@/lib/tmdb/types"
import { cx } from "@/lib/utils"
import { RateStar } from "@/components/rate-star"

export type CardBadge = {
  text?: string
  logoPath?: string
}

// Poster card used on browse grids + home rows + search results (matches /movies grid MediaCard)
export function MediaCard({
  item,
  badge,
  wrapClass,
  fill = false,
}: {
  item: MediaItem
  badge?: CardBadge
  wrapClass?: string
  fill?: boolean
}) {
  const href = mediaUrl(item)
  const src = badge?.logoPath ? img(badge.logoPath, "w154") : poster(item, "w500")
  const rating = item.vote_average > 0 ? item.vote_average.toFixed(1) : null

  return (
    <Link
      href={href}
      aria-label={item.title}
      className={cx(
        "block transition-transform duration-500 ease-out hover:scale-105 hover:z-50 origin-center group/card cursor-pointer",
        fill ? "w-full min-w-0" : "flex-none w-[140px] lg:w-[200px]",
        wrapClass,
      )}
    >
      <div className="aspect-[2/3] rounded-xl overflow-hidden bg-white/5 shadow-xl shadow-black/40 relative isolate">
        <img
          className="block w-full h-full object-cover transition-all duration-300 lg:group-hover/card:brightness-50"
          loading="lazy"
          src={src ?? undefined}
          alt={item.title}
        />
        {rating && (
          <span className="absolute top-2 left-2 lg:hidden px-2 py-0.5 flex items-center gap-1 text-[10px] font-semibold rounded-full bg-black/60 border border-white/20 text-white backdrop-blur-md z-10">
            <RateStar color={rateColor(item.vote_average)} className="w-2.5 h-2.5" />
            {rating}
          </span>
        )}
        {badge?.text && (
          <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-black/60 border border-white/20 text-white backdrop-blur-md z-10">
            {badge.text}
          </span>
        )}
        <div className="card-hover-veil absolute inset-0 bg-gradient-to-br from-white/10 to-transparent transition-opacity duration-500 pointer-events-none opacity-0 lg:group-hover/card:opacity-100" />
        <div className="hidden lg:flex absolute inset-0 flex-col items-center justify-center p-4 transition-all duration-300 transform opacity-0 translate-y-4 group-hover/card:opacity-100 group-hover/card:translate-y-0">
          <span className="bg-white text-black rounded-full p-3 mb-3 transition-transform shadow-lg shadow-white/20 group-hover/card:scale-110" aria-hidden>
            <Play className="w-6 h-6 fill-current" />
          </span>
          <div className="text-center w-full space-y-1">
            <h3 className="font-bold text-white text-sm leading-tight line-clamp-2 drop-shadow-md">{item.title}</h3>
            <div className="flex items-center justify-center gap-2 text-xs text-white/80 font-medium">
              <span>{year(item.release_date)}</span>
              {rating && (
                <span className="flex items-center gap-0.5">
                  <RateStar color={rateColor(item.vote_average)} className="w-3 h-3" />
                  {rating}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="lg:hidden mt-2 pb-1 space-y-1">
        <h3 className="font-medium text-white text-xs leading-tight line-clamp-1">{item.title}</h3>
        <div className="flex items-center gap-1.5 text-[10px] text-white/60">
          <span>{year(item.release_date)}</span>
          <span className="text-white/40 select-none">·</span>
          <span>{item.kind === "movie" ? "Movie" : "TV"}</span>
        </div>
      </div>
    </Link>
  )
}

// Spotlight card: 16:9 wide card with hover overlay, used on /movies & /series pages
export function SpotlightCard({
  item,
  badge,
  heroHref,
}: {
  item: MediaItem
  badge?: string
  heroHref?: string
}) {
  const href = heroHref ?? mediaUrl(item)
  const src = backdrop(item, "w780")
  return (
    <Link
      href={href}
      className="flex-none snap-start w-[70vw] max-w-[280px] sm:w-[264px] sm:max-w-none lg:w-[316px] group/card cursor-pointer origin-center transition-transform duration-500 ease-out hover:scale-105 hover:z-50"
    >
      <div className="aspect-video rounded-xl overflow-hidden bg-white/5 shadow-xl shadow-black/40 relative isolate">
        <img
          loading="lazy"
          className="block w-full h-full object-cover transition-all duration-300 lg:group-hover/card:brightness-50"
          src={src ?? undefined}
          alt={item.title}
        />
        <div className="card-hover-veil absolute inset-0 bg-gradient-to-br from-white/10 to-transparent transition-opacity duration-500 pointer-events-none opacity-0 lg:group-hover/card:opacity-100" />
        <div className="hidden lg:flex absolute inset-0 flex-col items-center justify-center px-4 pointer-events-none transition-all duration-300 transform opacity-0 translate-y-4 group-hover/card:opacity-100 group-hover/card:translate-y-0">
          <div className="text-center w-full space-y-1">
            <h3 className="font-bold text-white text-sm leading-tight line-clamp-2 drop-shadow-md">{item.title}</h3>
            <p className="flex items-center justify-center gap-1.5 text-xs text-white/80 font-medium">
              <span>{year(item.release_date)}</span>
            </p>
          </div>
        </div>
      </div>
      {badge && <span className="spotlight-badge">{badge}</span>}
      <h3 className="mt-2 font-medium text-white text-xs leading-tight line-clamp-1">{item.title}</h3>
      <p className="text-[10px] text-white/60">{year(item.release_date)}</p>
    </Link>
  )
}

// Provider tile rail item
export function ProviderTile({ id, name, logoPath }: { id: number; name: string; logoPath: string }) {
  return (
    <Link href={`/provider/${id}`} className="group/tile flex-none flex flex-col items-center gap-2 w-[76px] lg:w-[92px]">
      <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl overflow-hidden bg-white/5 ring-1 ring-white/10 shadow-lg transition-all duration-300 group-hover/tile:scale-105 group-hover/tile:ring-white/30">
        <img className="w-full h-full object-cover" loading="lazy" src={img(logoPath, "w154") ?? undefined} alt={name} draggable={false} />
      </div>
      <span className="text-[11px] lg:text-xs font-medium text-white/55 group-hover/tile:text-white text-center leading-tight line-clamp-2 transition-colors duration-300">
        {name}
      </span>
    </Link>
  )
}
