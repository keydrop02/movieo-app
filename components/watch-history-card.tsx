"use client"

import Link from "next/link"
import { Play } from "lucide-react"
import { getProgress, timeAgo, type HistoryEntry, type Progress } from "@/lib/watch-store"
import { img } from "@/lib/tmdb/images"
import { rateColor, year } from "@/lib/utils"
import { RateStar } from "@/components/rate-star"

export function watchHref(entry: HistoryEntry, p?: Progress): string {
  if (entry.type === "movie") {
    return `/watch/movie/${entry.id}`
  }
  const s = p?.season && p.season > 0 ? p.season : entry.season ?? 1
  const ep = p?.episode && p.episode > 0 ? p.episode : entry.episode ?? 1
  return `/watch/tv/${entry.id}/${s}/${ep}`
}

export function WatchHistoryCard({
  entry,
  progress,
  onRemove,
}: {
  entry: HistoryEntry
  progress?: Progress
  onRemove?: (entry: HistoryEntry) => void
}) {
  const p =
    progress ??
    getProgress(entry.id, entry.type, entry.type === "tv" ? entry.season : undefined, entry.type === "tv" ? entry.episode : undefined)
  const href = watchHref(entry, p)
  const back = img(entry.backdrop_path, "w780") ?? img(entry.poster_path, "w342")

  return (
    <div className="relative group/item">
      <Link
        href={href}
        title={entry.title}
        className="group/card relative block rounded-xl overflow-hidden bg-white/5 shadow-xl shadow-black/40 border border-white/10 hover:border-white/25 transition-colors cursor-pointer"
      >
        <div className="relative aspect-video overflow-hidden">
          {back ? (
            <img
              src={back}
              alt={entry.title}
              loading="lazy"
              className="w-full h-full object-cover transition-all duration-300 group-hover/card:brightness-50"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-3xl font-bold text-white/15">{entry.title.slice(0, 1).toUpperCase()}</span>
            </div>
          )}
          <div className="card-hover-veil absolute inset-0 bg-gradient-to-br from-white/10 to-transparent transition-opacity duration-500 pointer-events-none opacity-0 group-hover/card:opacity-100" />
          <div className="hidden lg:flex absolute inset-0 flex-col items-center justify-center p-4 pointer-events-none transition-all duration-300 transform opacity-0 translate-y-4 group-hover/card:opacity-100 group-hover/card:translate-y-0">
            <span className="bg-white text-black rounded-full p-2.5 mb-2.5 transition-transform shadow-lg shadow-white/20 group-hover/card:scale-110" aria-hidden>
              <Play className="w-4.5 h-4.5 fill-current" />
            </span>
            <h3 className="font-bold text-white text-sm leading-tight line-clamp-1 drop-shadow-md w-full text-center">{entry.title}</h3>
            <p className="flex items-center justify-center gap-1.5 text-xs text-white/80 font-medium">
              {entry.release_date ? <span>{year(entry.release_date)}</span> : null}
              {entry.vote_average > 0 && (
                <span className="flex items-center gap-0.5">
                  <RateStar color={rateColor(entry.vote_average)} className="w-3 h-3" />
                  {entry.vote_average.toFixed(1)}
                </span>
              )}
            </p>
          </div>
          {p && p.percent > 0 && p.percent < 90 && (
            <div className="absolute bottom-0 inset-x-0 px-2.5 py-1.5 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
              <span className="block text-right text-[10px] font-semibold tabular-nums leading-none text-[var(--theme-progress-accent)]">
                {Math.round(p.percent)}%
              </span>
              <div className="mt-0.5 h-1 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: "var(--theme-progress-accent)",
                    boxShadow: "0 0 8px color-mix(in srgb, var(--theme-progress-accent) 80%, transparent)",
                    width: `${Math.min(p.percent, 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </Link>
      <p className="mt-1.5 text-[11px] font-medium text-white/80 truncate lg:hidden">{entry.title}</p>
      <p className="mt-0.5 text-[10px] text-white/60">Watched {timeAgo(entry.lastWatchedAt)}{timeAgo(entry.lastWatchedAt) === "just now" ? "" : " ago"}</p>
      {onRemove && (
        <button
          aria-label={`Remove ${entry.title}`}
          title="Remove from list"
          onClick={() => onRemove(entry)}
          className="absolute top-2 right-2 z-[999] w-[26px] h-[26px] rounded-full bg-black/60 text-white flex items-center justify-center sm:opacity-0 sm:group-hover/item:opacity-100 transition-all duration-200 hover:bg-[#e50914]"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z"
            />
          </svg>
        </button>
      )}
    </div>
  )
}