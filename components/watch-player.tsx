"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowLeft, Grid3x3, Server } from "lucide-react"
import type { Season } from "@/lib/tmdb/types"
import { getEmbedSources, type EmbedSource } from "@/lib/tmdb/embeds"
import { addHistory, clearProgressPurge, getProgress, isProgressPurged, updateProgress } from "@/lib/watch-store"
import { orderSources } from "@/lib/server-prefs"
import { readPrefs } from "@/lib/prefs"
import { cx } from "@/lib/utils"

interface EpisodeBrief {
  episode_number: number
  name: string
  overview: string
  still_path: string | null
  runtime: number | null
}

export function WatchPlayer({
  id,
  kind,
  title,
  season,
  episodeNumber,
  episodeName,
  seasons = [],
  poster: posterPath,
  backdrop: backdropPath,
  rating = 0,
  releaseDate,
  backHref,
}: {
  id: number
  kind: "movie" | "tv"
  title: string
  season: number
  episodeNumber: number
  episodeName?: string | null
  seasons?: Season[]
  poster?: string | null
  backdrop?: string | null
  rating?: number
  releaseDate?: string | null
  backHref: string
}) {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const durationRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTickRef = useRef({ sec: -1, dur: -1 })
  const lastHistorySecRef = useRef(-1)
  const loadedSrcRef = useRef<string | null>(null)

  const [bust] = useState(() => (isProgressPurged(id, kind) ? `_fresh=${Math.random().toString(36).slice(2)}` : undefined))

  const [startAt, setStartAt] = useState(() => (isProgressPurged(id, kind) ? 0 : getProgress(id, kind, season, episodeNumber)?.currentTime ?? 0))

  const seasonList = useCallback(
    () =>
      seasons
        .filter((s) => s.season_number > 0)
        .sort((a, b) => a.season_number - b.season_number),
    [seasons],
  )

  const buildSources = useCallback(
    (seas: number, ep: number) =>
      orderSources(
        getEmbedSources({
          type: kind,
          tmdbId: id,
          season: seas,
          episode: ep,
          startAt,
          bust,
        }),
      ),
    [kind, id, startAt, bust],
  )

  // Client-only state: resume lives in localStorage; the embed only renders after hydration.
  const [source, setSource] = useState<EmbedSource | null>(() => {
    if (typeof window === "undefined") return null
    const srcs = buildSources(season, episodeNumber)
    if (isProgressPurged(id, kind)) {
      localStorage.removeItem("movieo:server")
      return srcs[0] || null
    }
    const fromUrl = new URLSearchParams(window.location.search).get("server")
    const stored = localStorage.getItem("movieo:server")
    return (fromUrl && srcs.find((s) => s.id === fromUrl)) || (stored && srcs.find((s) => s.id === stored)) || srcs[0] || null
  })

  const [currentSeason, setCurrentSeason] = useState(season)
  const [currentEpisode, setCurrentEpisode] = useState(episodeNumber)
  const [playedSeason, setPlayedSeason] = useState(season)
  const [menuOpen, setMenuOpen] = useState(false)
  const [episodesOpen, setEpisodesOpen] = useState(false)
  const [episodeData, setEpisodeData] = useState<Record<number, EpisodeBrief[]>>({})
  const [loading, setLoading] = useState(true)
  const [seasonMenuOpen, setSeasonMenuOpen] = useState(false)

  useEffect(() => {
    if (!source) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setLoading(false), 1500)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [source])

  useEffect(() => {
    if (isProgressPurged(id, kind)) clearProgressPurge(id, kind)
  }, [id, kind])

  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted && isProgressPurged(id, kind)) {
        clearProgressPurge(id, kind)
        window.location.reload()
      }
    }
    window.addEventListener("pageshow", onShow)
    return () => window.removeEventListener("pageshow", onShow)
  }, [id, kind])

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    [],
  )

  const recordProgress = useCallback(
    (time: number, duration: number) => {
      if (time <= 2 || !source || isProgressPurged(id, kind)) return
      const { trackHistory, trackProgress } = readPrefs()
      const sec = Math.floor(time)
      const dur = Math.floor(duration)
      if (sec === lastTickRef.current.sec && dur === lastTickRef.current.dur) return
      lastTickRef.current = { sec, dur }
      if (trackHistory && sec - lastHistorySecRef.current >= 10) {
        lastHistorySecRef.current = sec
        addHistory({
          id,
          type: kind,
          title,
          poster_path: posterPath ?? null,
          backdrop_path: backdropPath ?? null,
          vote_average: rating,
          season: kind === "tv" ? playedSeason : undefined,
          episode: kind === "tv" ? currentEpisode : undefined,
          provider: source.id,
          release_date: releaseDate ?? null,
        })
      }
      if (trackProgress) {
        updateProgress(id, kind, {
          currentTime: sec,
          duration: dur,
          season: kind === "tv" ? playedSeason : undefined,
          episode: kind === "tv" ? currentEpisode : undefined,
          provider: source.id,
        })
      }
    },
    [id, kind, title, source, posterPath, backdropPath, rating, releaseDate, playedSeason, currentEpisode],
  )

  useEffect(() => {
    durationRef.current = 0
    lastHistorySecRef.current = -1
  }, [source])

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!frameRef.current || event.source !== frameRef.current.contentWindow) return
      const data = event.data
      if (!data || typeof data !== "object") return

      if (typeof data.type === "string" && data.type.startsWith("cinesrc:")) {
        if (data.type === "cinesrc:loadedmetadata") {
          durationRef.current = data.duration || 0
          return
        }
        if (data.type === "cinesrc:timeupdate") {
          recordProgress(data.currentTime || 0, data.duration || durationRef.current || 0)
        }
        return
      }

      if (data.type === "PLAYER_EVENT" && data.data && typeof data.data === "object") {
        const m = data.data
        if (m.event === "timeupdate" || m.event === "playerstatus") {
          recordProgress(m.currentTime || 0, m.duration || durationRef.current || 0)
        }
        return
      }

      if (data.type === "player.event" && data.event && data.event.name === "position") {
        recordProgress(data.event.position || 0, data.event.duration || 0)
      }
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [recordProgress])

  const loadSource = (s: EmbedSource) => {
    setSource(s)
    setLoading(true)
    setMenuOpen(false)
    localStorage.setItem("movieo:server", s.id)
  }

  const onFrameLoad = () => {
    setLoading(false)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!source || loadedSrcRef.current === source.url) return
    loadedSrcRef.current = source.url
    if (startAt > 2) {
      if (source.id === "vidlove") {
        try {
          frameRef.current?.contentWindow?.postMessage({ type: "SET_TIME", time: startAt }, "*")
        } catch {
          /* ignore */
        }
      } else if (source.id === "xpass") {
        try {
          frameRef.current?.contentWindow?.postMessage(
            { type: "player.action", action: "playAt", position: startAt },
            "https://play.xpass.top",
          )
        } catch {
          /* ignore */
        }
      }
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return
      if (e.key.toLowerCase() === "e") {
        if (kind === "tv") {
          e.preventDefault()
          setEpisodesOpen((v) => !v)
        }
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [kind])

  const pendingFetch = useRef<Set<number>>(new Set())
  const fetchEpisodes = useCallback(
    async (seas: number) => {
      if (pendingFetch.current.has(seas)) return
      pendingFetch.current.add(seas)
      try {
        const res = await fetch(`/api/episodes/${id}/${seas}`)
        const data = await res.json()
        const eps: EpisodeBrief[] = Array.isArray(data.episodes) ? data.episodes : []
        setEpisodeData((prev) => (prev[seas] ? prev : { ...prev, [seas]: eps }))
      } catch {
        setEpisodeData((prev) => (prev[seas] ? prev : { ...prev, [seas]: [] }))
      } finally {
        pendingFetch.current.delete(seas)
      }
    },
    [id],
  )

  useEffect(() => {
    if (episodesOpen && kind === "tv" && !episodeData[currentSeason]) {
      const timer = setTimeout(() => fetchEpisodes(currentSeason), 0)
      return () => clearTimeout(timer)
    }
  }, [episodesOpen, kind, currentSeason, episodeData, fetchEpisodes])

  const currentSeasonEpisodes = episodeData[currentSeason] ?? null

  const selectEpisode = (seas: number, ep: number) => {
    const resumeFrom = getProgress(id, kind, seas, ep)?.currentTime ?? 0
    setStartAt(resumeFrom)
    const options = getEmbedSources({ type: kind, tmdbId: id, season: seas, episode: ep, startAt: resumeFrom, bust })
    const next = options.find((s) => s.id === source?.id) ?? options[0] ?? null
    if (seas !== currentSeason) {
      setCurrentSeason(seas)
      setSeasonMenuOpen(false)
    }
    setPlayedSeason(seas)
    setCurrentEpisode(ep)
    setLoading(true)
    setSource(next)
  }

  const changeSeason = (seas: number) => {
    if (seas === currentSeason) {
      setSeasonMenuOpen(false)
      return
    }
    setCurrentSeason(seas)
    setSeasonMenuOpen(false)
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black overflow-hidden select-none">
      {source && (
        <iframe
          ref={frameRef}
          src={source.url}
          onLoad={onFrameLoad}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          title={title}
        />
      )}
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black">
          <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
      )}

      {/* top bar */}
      <div className="absolute inset-x-0 top-0 z-30">
        <div className="bg-gradient-to-b from-black/85 via-black/45 to-transparent pt-3 lg:pt-4 px-4 lg:px-6 pb-10">
          <div className="flex items-center gap-3">
        <a href={backHref} aria-label="Back to details" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
          <ArrowLeft className="w-6 h-6" />
          <span className="hidden sm:inline text-sm font-medium truncate max-w-[180px] lg:max-w-[420px]">{title}</span>
        </a>
        {kind === "tv" && (
          <span
            title={episodeName ?? undefined}
            className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-white/80 shrink-0 cursor-default"
          >
            S{playedSeason} E{currentEpisode}
            {episodeName ? <span className="hidden lg:inline text-white/50 normal-case font-normal ml-1.5 max-w-[200px] truncate">· {episodeName}</span> : null}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {/* source dropdown */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="flex items-center gap-2 h-9 px-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <Server className="w-3.5 h-3.5 text-white/70" />
              <span>{source?.label ?? "Source"}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/60">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {menuOpen && (
              <div
                role="menu"
                aria-label="Streaming sources"
                className="absolute right-0 top-full mt-2 w-44 bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-1.5 z-50 animate-dropdown-in"
              >
                {buildSources(currentSeason, currentEpisode).map((s) => (
                  <button
                    key={s.id}
                    role="menuitem"
                    onClick={() => loadSource(s)}
                    className={cx(
                      "w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                      s.id === source?.id ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {kind === "tv" && (
            <button
              onClick={() => setEpisodesOpen((v) => !v)}
              aria-expanded={episodesOpen}
              className={cx(
                "flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-semibold border transition-colors cursor-pointer",
                episodesOpen ? "bg-white text-black border-white" : "bg-white/10 hover:bg-white/20 border-white/10 text-white",
              )}
            >
              <Grid3x3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Episodes</span>
            </button>
          )}
</div>
        </div>
      </div>
      </div>

      {/* episodes panel */}
      {kind === "tv" && episodesOpen && (
        <div className="absolute right-0 top-0 bottom-0 z-[65] w-full max-w-[420px] bg-[#0c0c0e]/95 backdrop-blur-xl border-l border-white/10 flex flex-col shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h3 className="text-sm font-semibold text-white/90">Episodes</h3>
            <button
              onClick={() => setEpisodesOpen(false)}
              aria-label="Close episodes"
              className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="relative px-4 pt-3">
            <button
              onClick={() => setSeasonMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={seasonMenuOpen}
              className="flex items-center gap-2 h-9 px-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              {seasonList().find((s) => s.season_number === currentSeason)?.name || `Season ${currentSeason}`}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/60">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {seasonMenuOpen && (
              <div className="absolute top-full mt-2 left-4 right-4 bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-1.5 z-50 animate-dropdown-in">
                {seasonList().map((s) => (
                  <button
                    key={s.season_number}
                    onClick={() => changeSeason(s.season_number)}
                    className={cx(
                      "w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center justify-between",
                      s.season_number === currentSeason ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    <span>{s.name || `Season ${s.season_number}`}</span>
                    {s.season_number === currentSeason && (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 glass-scrollbar mt-2">
            {currentSeasonEpisodes === null ? (
              <div className="flex justify-center py-10">
                <div className="w-7 h-7 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              </div>
            ) : currentSeasonEpisodes.length === 0 ? (
              <p className="text-white/40 text-xs py-6 text-center">No episodes available for this season yet.</p>
            ) : (
              currentSeasonEpisodes.map((ep) => {
                const activeNow = playedSeason === currentSeason && ep.episode_number === currentEpisode
                return (
                  <button
                    key={ep.episode_number}
                    onClick={() => selectEpisode(currentSeason, ep.episode_number)}
                    className={cx(
                      "w-full flex gap-3 p-2 rounded-xl border text-left transition-colors cursor-pointer",
                      activeNow
                        ? "bg-white/10 border-white/25"
                        : "bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.09] hover:border-white/20",
                    )}
                  >
                    <div className="relative flex-none w-24 aspect-video rounded-lg overflow-hidden bg-white/5">
                      {ep.still_path ? (
                        <img src={`https://image.tmdb.org/t/p/w300${ep.still_path}`} alt={ep.name || `Episode ${ep.episode_number}`} loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <span className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white/40">
                          E{String(ep.episode_number).padStart(2, "0")}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-white/50 tabular-nums">E{String(ep.episode_number).padStart(2, "0")}</span>
                        <p className="text-xs font-medium text-white/90 truncate">{ep.name || `Episode ${ep.episode_number}`}</p>
                      </div>
                      {ep.runtime ? <span className="text-[10px] text-white/35">{ep.runtime}m</span> : null}
                      {ep.overview ? <p className="text-[11px] text-white/45 line-clamp-2 mt-0.5">{ep.overview}</p> : null}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}