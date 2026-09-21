"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Check, ChevronDown, Copy, Download, X } from "lucide-react"
import { cx } from "@/lib/utils"

interface DownloadLink {
  url: string
  quality?: number
  size?: string
  provider?: string
  source?: string
}

function resLabel(q?: number): string {
  if (!q || q <= 0) return "HD"
  if (q >= 2160) return "4K"
  if (q >= 1440) return "1440p"
  if (q >= 1080) return "1080p"
  if (q >= 720) return "720p"
  return `${q}p`
}

function providerLabel(l: DownloadLink): string {
  const v = l.provider || l.source || ""
  if (/4khdhub/i.test(v)) return ""
  return v
}

function fileName(url: string): string {
  try {
    const u = new URL(url)
    const last = u.pathname.split("/").filter(Boolean).pop()
    if (last) return decodeURIComponent(last)
  } catch {
    /* ignore */
  }
  return "download.mkv"
}

export function DownloadModal({
  item,
  label,
  triggerClass = "",
  children,
}: {
  item: { id: number; kind: "movie" | "tv"; title: string; seasons?: Array<{ season_number: number }> }
  label: string
  triggerClass?: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [links, setLinks] = useState<DownloadLink[]>([])
  const [seasons, setSeasons] = useState<number[]>([])
  const [season, setSeason] = useState(1)
  const [episodes, setEpisodes] = useState<number[]>([])
  const [episode, setEpisode] = useState(1)
  const [seasonOpen, setSeasonOpen] = useState(false)
  const [episodeOpen, setEpisodeOpen] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const busyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  useEffect(() => () => {
    if (busyTimer.current) clearTimeout(busyTimer.current)
    if (copyTimer.current) clearTimeout(copyTimer.current)
  }, [])

  const loadLinks = useCallback(
    async (seas: number, ep: number) => {
      setLoading(true)
      setMessage(null)
      setLinks([])
      const url =
        item.kind === "tv"
          ? `https://downloads.shegu.st/tv/${item.id}/${seas}/${ep}`
          : `https://downloads.shegu.st/movie/${item.id}`
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error("bad status")
        const data = await res.json()
        setLinks(Array.isArray(data.links) ? data.links : [])
        if (!Array.isArray(data.links) || data.links.length === 0) {
          setMessage("No download links available for this title.")
        }
      } catch {
        setMessage("Couldn't load download links. Please try again.")
      } finally {
        setLoading(false)
      }
    },
    [item.id, item.kind],
  )

  const openModal = () => {
    const seas = (item.seasons || [])
      .map((s) => s.season_number)
      .filter((n) => n > 0)
      .sort((a, b) => a - b)
    setSeasons(seas)
    const firstSeason = seas[0] || 1
    setSeason(firstSeason)
    setEpisodeOpen(false)
    setSeasonOpen(false)
    setCopied(null)
    setLinks([])
    setMessage(null)
    setOpen(true)

    if (item.kind === "tv") {
      setEpisode(1)
      setEpisodes([])
      fetch(`/api/episodes/${item.id}/${firstSeason}`)
        .then((r) => r.json())
        .then((data) => {
          const eps = (Array.isArray(data.episodes) ? data.episodes : []) as Array<{ episode_number: number }>
          const nums = eps.map((e) => e.episode_number).filter((n) => n > 0)
          setEpisodes(nums)
          const firstEp = nums[0] || 1
          setEpisode(firstEp)
          loadLinks(firstSeason, firstEp)
        })
        .catch(() => {
          setEpisodes([])
          loadLinks(firstSeason, 1)
        })
    } else {
      loadLinks(firstSeason, 1)
    }
  }

  const pickSeason = (s: number) => {
    if (s === season) {
      setSeasonOpen(false)
      return
    }
    setSeason(s)
    setSeasonOpen(false)
    setEpisode(1)
    setEpisodes([])
    fetch(`/api/episodes/${item.id}/${s}`)
      .then((r) => r.json())
      .then((data) => {
        const eps = (Array.isArray(data.episodes) ? data.episodes : []) as Array<{ episode_number: number }>
        const nums = eps.map((e) => e.episode_number).filter((n) => n > 0)
        setEpisodes(nums)
        const firstEp = nums[0] || 1
        setEpisode(firstEp)
        loadLinks(s, firstEp)
      })
      .catch(() => {
        setEpisodes([])
        loadLinks(s, 1)
      })
  }

  const pickEpisode = (e: number) => {
    setEpisodeOpen(false)
    if (e === episode) return
    setEpisode(e)
    loadLinks(season, e)
  }

  const doDownload = (l: DownloadLink) => {
    if (!l.url || busy) return
    setBusy(true)
    if (busyTimer.current) clearTimeout(busyTimer.current)
    busyTimer.current = setTimeout(() => setBusy(false), 800)
    const a = document.createElement("a")
    a.href = `/api/download?url=${encodeURIComponent(l.url)}`
    a.download = fileName(l.url)
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const doCopy = (l: DownloadLink) => {
    if (!l.url) return
    navigator.clipboard
      .writeText(l.url)
      .then(() => {
        setCopied(l.url)
        if (copyTimer.current) clearTimeout(copyTimer.current)
        copyTimer.current = setTimeout(() => setCopied(null), 1500)
      })
      .catch(() => {})
  }

  const panel = (
    <div className="fixed inset-0 z-[160]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        ref={rootRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Download ${item.title}`}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-2rem)] max-w-lg max-h-[80vh] flex flex-col bg-[#141414]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-dropdown-in"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <Download className="w-4 h-4 text-white/50 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-white/90 truncate">{item.title}</h3>
              <p className="text-[11px] text-white/40">{item.kind === "movie" ? "Download" : "Download episode"}</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {item.kind === "tv" && (
          <div className="flex items-center gap-2 px-5 pt-4">
            <div className="relative">
              <button
                onClick={() => {
                  setSeasonOpen((v) => !v)
                  setEpisodeOpen(false)
                }}
                aria-haspopup="menu"
                aria-expanded={seasonOpen}
                className="flex items-center gap-2 h-9 px-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                S{season}
                <ChevronDown className="w-3 h-3 text-white/60" />
              </button>
              {seasonOpen && (
                <div className="absolute top-full mt-1.5 left-0 w-36 bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-1.5 z-50 animate-dropdown-in">
                  {seasons.length === 0
                    ? [season].map((s) => <Picky key={s} label={`S${s}`} active onClick={() => pickSeason(s)} />)
                    : seasons.map((s) => (
                        <Picky key={s} label={`Season ${s}`} active={s === season} onClick={() => pickSeason(s)} />
                      ))}
                </div>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => {
                  setEpisodeOpen((v) => !v)
                  setSeasonOpen(false)
                }}
                aria-haspopup="menu"
                aria-expanded={episodeOpen}
                className="flex items-center gap-2 h-9 px-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                E{episode}
                <ChevronDown className="w-3 h-3 text-white/60" />
              </button>
              {episodeOpen && (
                <div className="absolute top-full mt-1.5 left-0 w-36 max-h-52 overflow-y-auto bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-1.5 z-50 animate-dropdown-in glass-scrollbar">
                  {episodes.length === 0
                    ? [1].map((e) => <Picky key={e} label={`E${e}`} onClick={() => pickEpisode(e)} />)
                    : episodes.map((e) => (
                        <Picky key={e} label={`Episode ${e}`} active={e === episode} onClick={() => pickEpisode(e)} />
                      ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5 glass-scrollbar">
          {loading ? (
            <div className="space-y-2.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-white/[0.05] animate-pulse" />
              ))}
            </div>
          ) : message ? (
            <p className="text-xs text-white/45 py-6 text-center">{message}</p>
          ) : (
            <ul className="space-y-2">
              {links.map((l, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.14] transition-colors"
                >
                  <span className="flex-none w-16 text-center px-2 py-1 rounded-md text-[11px] font-bold bg-white/10 text-white/80 border border-white/10">
                    {resLabel(l.quality)}
                  </span>
                  <div className="min-w-0 flex-1 flex items-center gap-2">
                    <span className="text-xs text-white/70 tabular-nums">{l.size || "—"}</span>
                    {providerLabel(l) && <span className="text-[11px] text-white/30 truncate">{providerLabel(l)}</span>}
                  </div>
                  <button
                    onClick={() => doCopy(l)}
                    title="Copy link"
                    aria-label="Copy link"
                    className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer shrink-0"
                  >
                    {copied === l.url ? <Check className="w-4 h-4 text-[#95ff50]" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => doDownload(l)}
                    title="Download"
                    disabled={busy}
                    className="flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-lg bg-white hover:bg-white/80 border border-white/40 text-black text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40 shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Download</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <>
      <button aria-label={label} aria-expanded={open} onClick={() => (open ? setOpen(false) : openModal())} className={cx(triggerClass)}>
        {children}
      </button>
      {open && typeof document !== "undefined" ? createPortal(panel, document.body) : null}
    </>
  )
}

function Picky({
  label,
  active = false,
  onClick,
}: {
  label: string
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={cx(
        "w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer",
        active ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white",
      )}
    >
      {label}
    </button>
  )
}