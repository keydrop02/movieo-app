"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import {
  AlertTriangle,
  Archive,
  Download,
  GripVertical,
  History,
  Monitor,
  PlayCircle,
  RotateCcw,
  Search,
  ShieldCheck,
  Star,
  Upload,
  X,
} from "lucide-react"
import { cx } from "@/lib/utils"
import { site } from "@/lib/site"
import { applyPrefs, DEFAULT_PREFS, readPrefs, writePrefs, type Prefs } from "@/lib/prefs"
import { clearAllPurges, clearHistory, clearProgress, getHistory, parseHistoryImport, setHistory } from "@/lib/watch-store"
import { parseListImport, readLists, serializeListFile, writeLists, itemKey } from "@/lib/lists"
import { getProviders } from "@/lib/tmdb/embeds"
import { clearAllServerPrefs, clearServerOrder, readServerOrder, writeServerOrder } from "@/lib/server-prefs"
import { clearRecentSearches } from "@/lib/search-history"
import { clearEpisodeTimings } from "@/lib/episode-timing"
import { useDialog } from "@/lib/use-dialog"
import { getInstallState, promptInstall, subscribeInstall, type InstallState } from "@/lib/install-prompt"

const PROVIDERS = getProviders()
const DEFAULT_ORDER = PROVIDERS.map((p) => p.id)

type ConfirmTarget = "history" | "lists" | "storage" | null

function Section({ icon: Icon, title, desc, children }: { icon: React.ElementType; title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white/[0.05] border border-white/10 p-5 sm:p-6">
      <header className="flex items-start gap-3">
        <span className="flex items-center justify-center w-9 h-9 rounded-full bg-white/[0.06] border border-white/10 text-white/80 shrink-0">
          <Icon className="w-4.5 h-4.5" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-white/90">{title}</h2>
          <p className="text-[13px] text-white/45 mt-0.5">{desc}</p>
        </div>
      </header>
      <div className="mt-5">{children}</div>
    </section>
  )
}

const BTN_PILL =
  "inline-flex items-center gap-2 h-9 px-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white/80 hover:text-white text-xs font-semibold transition-colors cursor-pointer"

function Toggle({ on, onChange, label, desc }: { on: boolean; onChange: (v: boolean) => void; label: string; desc: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="min-w-0">
        <p className="text-sm font-medium text-white/90">{label}</p>
        <p className="text-[13px] text-white/45 mt-0.5">{desc}</p>
      </div>
      <button
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => onChange(!on)}
        className={cx(
          "relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer",
          on ? "bg-[#30d158]" : "bg-[#2c2c2f]",
        )}
      >
        <span
          className={cx(
            "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200",
            on && "translate-x-5",
          )}
        />
      </button>
    </div>
  )
}

export function SettingsPage() {
  const [prefs, setPrefs] = useState<Prefs>(() => readPrefs())
  const [confirming, setConfirming] = useState<ConfirmTarget>(null)
  const [historyCount, setHistoryCount] = useState(() => getHistory().length)
  const [order, setOrder] = useState<string[]>(() => readServerOrder())
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [listCount, setListCount] = useState(() => readLists().length)
  const [historySuccess, setHistorySuccess] = useState<number | null>(null)
  const [listSuccess, setListSuccess] = useState<number | null>(null)
  const confirmRef = useRef<HTMLDivElement>(null)
  const closeConfirm = useCallback(() => setConfirming(null), [])
  const dialogRef = useDialog<HTMLDivElement>(confirming !== null, closeConfirm)

  const [installState, setInstallState] = useState<InstallState>(() => getInstallState())
  const { available: canInstall, installed } = installState

  useEffect(() => subscribeInstall(() => setInstallState(getInstallState())), [])

  const requestInstall = () => {
    void promptInstall()
  }

  /**
   * Touch scrolling is suppressed while a provider row is being drag-reordered.
   * Driven from state rather than written inline inside the pointer handlers:
   * the React compiler treats a direct `document.body.style` assignment in an
   * event handler as a forbidden mutation of a value it cannot track, and
   * routing it through an effect is also the correct place for a side effect.
   */
  const [touchActionLocked, setTouchActionLocked] = useState(false)
  useEffect(() => {
    document.body.style.touchAction = touchActionLocked ? "none" : ""
    return () => {
      document.body.style.touchAction = ""
    }
  }, [touchActionLocked])

  const importRef = useRef<HTMLInputElement>(null)
  const historyImportRef = useRef<HTMLInputElement>(null)
  const dragStateRef = useRef<{
    id: string
    pointerId: number
    pointerType: string
    x: number
    y: number
    active: boolean
  } | null>(null)
  const holdTimerRef = useRef<number | null>(null)
  const rowRefs = useRef<Map<string, HTMLLIElement>>(new Map())
  const prevRowTops = useRef<Map<string, number>>(new Map())

  const clearHold = () => {
    if (holdTimerRef.current !== null) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
  }

  /**
   * FLIP animation for the server list. After a drag reorder the rows are laid
   * out in their new positions instantly; this reads each row's `offsetTop`
   * (layout position, so the drag scale does not skew it), snaps it back to its
   * previous offset with a transform, then releases it so it glides into place.
   * The row under the pointer is skipped so it tracks the cursor without lag.
   */
  useLayoutEffect(() => {
    const nextTops = new Map<string, number>()
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
    rowRefs.current.forEach((el, id) => {
      const top = el.offsetTop
      nextTops.set(id, top)
      const prev = prevRowTops.current.get(id)
      if (prev === undefined || id === dragId || reduceMotion) return
      const dy = prev - top
      if (Math.abs(dy) < 1) return
      el.animate(
        [{ transform: `translateY(${dy}px)` }, { transform: "translateY(0)" }],
        { duration: 220, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
      )
    })
    prevRowTops.current = nextTops
  })

  // Touch drags only work if the browser doesn't claim the gesture for
  // panning. Once a long-press activates a drag we swallow `touchmove`; a
  // non-passive native listener is required because `touch-action` can only be
  // honoured at gesture start and React's listener cannot cancel the scroll.
  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      const drag = dragStateRef.current
      if (drag?.active && drag.pointerType === "touch") e.preventDefault()
    }
    document.addEventListener("touchmove", onTouchMove, { passive: false })
    return () => document.removeEventListener("touchmove", onTouchMove)
  }, [])

  useEffect(() => {
    if (historySuccess === null) return
    const t = setTimeout(() => setHistorySuccess(null), 5000)
    return () => clearTimeout(t)
  }, [historySuccess])

  useEffect(() => {
    if (listSuccess === null) return
    const t = setTimeout(() => setListSuccess(null), 5000)
    return () => clearTimeout(t)
  }, [listSuccess])

  const displayOrder = (() => {
    if (order.length === 0) return DEFAULT_ORDER
    const present = order.filter((id) => DEFAULT_ORDER.includes(id))
    const rest = DEFAULT_ORDER.filter((id) => !present.includes(id))
    return [...present, ...rest]
  })()

  const apply = (next: Prefs) => {
    writePrefs(next)
    applyPrefs(next)
    setPrefs(next)
  }

  useEffect(() => {
    const refresh = () => {
      setHistoryCount(getHistory().length)
      setListCount(readLists().length)
    }
    window.addEventListener("storage", refresh)
    return () => window.removeEventListener("storage", refresh)
  }, [])

  useEffect(() => {
    if (!confirming) return
    const onDown = (e: MouseEvent) => {
      if (confirmRef.current && !confirmRef.current.contains(e.target as Node)) setConfirming(null)
    }
    document.addEventListener("mousedown", onDown)
    return () => {
      document.removeEventListener("mousedown", onDown)
    }
  }, [confirming])

  const clearWatchHistory = () => {
    clearHistory()
    clearProgress()
    clearAllPurges()
    setHistoryCount(0)
    setConfirming(null)
  }

  const clearAllLists = () => {
    writeLists([])
    setListCount(0)
    setConfirming(null)
  }

  const exportHistory = () => {
    const items = getHistory()
    if (items.length === 0) return
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `movieo-history-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const importHistory = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    file
      .text()
      .then((text) => {
        const parsed = parseHistoryImport(text)
        if (parsed) {
          const existing = getHistory()
          const merged = [...existing]
          let added = 0
          for (const entry of parsed) {
            const idx = merged.findIndex((e) => e.id === entry.id && e.type === entry.type)
            if (idx === -1) {
              merged.push(entry)
              added++
            } else if (new Date(entry.lastWatchedAt) > new Date(merged[idx].lastWatchedAt)) {
              merged[idx] = entry
              added++
            }
          }
          setHistory(merged)
          setHistoryCount(merged.length)
          setHistorySuccess(added)
        } else {
          window.alert("Invalid history file. Please use a file exported from Movieo.")
        }
      })
      .catch(() => {})
  }

  const exportLists = () => {
    const lists = readLists()
    if (lists.length === 0) return
    const blob = new Blob([serializeListFile(lists)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `movieo-lists-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const importLists = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    file
      .text()
      .then((text) => {
        const parsed = parseListImport(text)
        if (parsed) {
          const existing = readLists()
          const map = new Map(existing.map((l) => [l.id, { ...l }]))
          let added = 0
          for (const imported of parsed) {
            const existingList = map.get(imported.id)
            if (existingList) {
              const itemKeys = new Set(existingList.items.map(itemKey))
              for (const item of imported.items) {
                if (!itemKeys.has(itemKey(item))) {
                  existingList.items.push(item)
                  added++
                }
              }
            } else {
              map.set(imported.id, { ...imported })
              added += imported.items.length
            }
          }
          const merged = [...map.values()]
          writeLists(merged)
          setListCount(merged.length)
          setListSuccess(added)
        } else {
          window.alert("Invalid list file. Please use a file exported from Movieo.")
        }
      })
      .catch(() => {})
  }

  const clearStorage = () => {
    clearRecentSearches()
    clearEpisodeTimings()
    clearServerOrder()
    clearAllServerPrefs()
    applyPrefs(DEFAULT_PREFS)
    setPrefs(DEFAULT_PREFS)
    setOrder([])
    setConfirming(null)
  }

  const reorder = (fromId: string, toId: string) => {
    const list = displayOrder
    const from = list.indexOf(fromId)
    const to = list.indexOf(toId)
    if (from < 0 || to < 0 || from === to) return
    const next = list.slice()
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setOrder(next)
    writeServerOrder(next)
  }

  const startDrag = (e: React.PointerEvent<HTMLLIElement>, id: string) => {
    const pointerId = e.pointerId
    const pointerType = e.pointerType
    if (e.button !== 0 && pointerType === "mouse") return
    clearHold()
    const el = e.currentTarget
    if (pointerType === "mouse") {
      dragStateRef.current = { id, pointerId, pointerType, x: e.clientX, y: e.clientY, active: true }
      setDragId(id)
      setOverId(null)
      try {
        el.setPointerCapture(pointerId)
      } catch {}
      return
    }
    dragStateRef.current = { id, pointerId, pointerType, x: e.clientX, y: e.clientY, active: false }
    holdTimerRef.current = window.setTimeout(() => {
      holdTimerRef.current = null
      if (!dragStateRef.current || dragStateRef.current.pointerId !== pointerId || dragStateRef.current.active) return
      dragStateRef.current.active = true
      setDragId(id)
      setOverId(null)
      setTouchActionLocked(true)
      try {
        el.setPointerCapture(pointerId)
      } catch {}
    }, 350)
  }

  const moveDrag = (e: React.PointerEvent<HTMLLIElement>) => {
    const drag = dragStateRef.current
    if (!drag || e.pointerId !== drag.pointerId) return
    if (!drag.active) {
      if (Math.abs(e.clientX - drag.x) > 10 || Math.abs(e.clientY - drag.y) > 10) {
        clearHold()
        dragStateRef.current = null
      }
      return
    }
    e.preventDefault()
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-provider-id]")
    const over = el?.dataset.providerId ?? null
    if (over && over !== drag.id) reorder(drag.id, over)
    setOverId(over && over !== drag.id ? over : null)
  }

  const endDrag = (e: React.PointerEvent<HTMLLIElement>) => {
    const drag = dragStateRef.current
    if (!drag || e.pointerId !== drag.pointerId) return
    clearHold()
    dragStateRef.current = null
    if (drag.active) setTouchActionLocked(false)
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}
    setDragId(null)
    setOverId(null)
  }

  const resetServerOrder = () => {
    setOrder([])
    clearServerOrder()
  }

  const confirmTitle =
    confirming === "storage"
      ? "Clear storage?"
      : confirming === "lists"
        ? "Clear all lists?"
        : "Clear watch history?"
  const confirmBody =
    confirming === "storage"
      ? "This will remove your recent searches, server order, server preference, and restore playback settings to defaults. Watch history and lists are kept."
      : confirming === "lists"
        ? "This will permanently remove all your lists and their items. This can\u2019t be undone."
        : "This will permanently remove all watched entries and their progress. This can\u2019t be undone."
  const confirmAction = confirming === "storage" ? clearStorage : confirming === "lists" ? clearAllLists : clearWatchHistory
  const confirmLabel = confirming === "storage" ? "Clear storage" : "Clear all"

  return (
    <div className="relative z-10 min-h-[60vh] pt-28 px-6 lg:px-16 pb-20 max-w-3xl mx-auto">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Settings</h1>
          <p className="text-white/45 text-sm mt-2">
            Customize {site.name} the way you like. Changes save automatically on this device.
          </p>
        </div>
      </header>

      <div className="mt-8 space-y-4">
        <Section icon={Monitor} title="Appearance" desc="Effects, motion, and logos across the whole site.">
          <Toggle
            on={prefs.showImageLogos}
            onChange={(v) => apply({ ...prefs, showImageLogos: v })}
            label="Image Logos"
            desc="Use studio, network, and streaming-service logos where available instead of text."
          />
          <div className="mt-3 border-t border-white/[0.06]">
            <Toggle
              on={prefs.reducedMotion}
              onChange={(v) => apply({ ...prefs, reducedMotion: v })}
              label="Reduce Motion"
              desc="Disable animations and transitions site-wide."
            />
          </div>
          <div className="mt-3 pt-1 border-t border-white/[0.06]">
            <Toggle
              on={prefs.showContinueWatching}
              onChange={(v) => apply({ ...prefs, showContinueWatching: v })}
              label="Continue Watching"
              desc="Show unfinished movies and episodes on Home."
            />
          </div>
          <div className="mt-3 pt-1 border-t border-white/[0.06]">
            <Toggle
              on={prefs.showForYou}
              onChange={(v) => apply({ ...prefs, showForYou: v })}
              label="For You"
              desc="Show recommendations based on your watch history."
            />
          </div>
        </Section>

        <Section icon={PlayCircle} title="Playback" desc="Watch preferences and server order.">
          <div className="flex flex-col gap-4">
            <div>
              <Toggle
                on={prefs.trackProgress}
                onChange={(v) => apply({ ...prefs, trackProgress: v })}
                label="Resume Playback"
                desc="Save your playback progress so you can continue watching where you left off."
              />
              <div className="mt-3 pt-1 border-t border-white/[0.06]">
                <Toggle
                  on={prefs.autoPlayNext}
                  onChange={(v) => apply({ ...prefs, autoPlayNext: v })}
                  label="Auto-play Next"
                  desc="Automatically play the next episode."
                />
              </div>
              <div className="mt-3 pt-1 border-t border-white/[0.06]">
                <Toggle
                  on={prefs.autoSkipIntros}
                  onChange={(v) => apply({ ...prefs, autoSkipIntros: v })}
                  label="Auto-skip Intros & Recaps"
                  desc="Skip intros and recaps when timing data is available."
                />
              </div>
              <div className="mt-3 pt-1 border-t border-white/[0.06]">
                <Toggle
                  on={prefs.spoilerShield}
                  onChange={(v) => apply({ ...prefs, spoilerShield: v })}
                  label="Spoiler Shield"
                  desc="Hide artwork and descriptions for unwatched episodes."
                />
              </div>
            </div>
            <div className="mt-1 pt-1 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
              <p className="text-[13px] text-white/45">Drag servers to choose which one plays first.</p>
              <button
                onClick={resetServerOrder}
                disabled={order.length === 0}
                className={cx(
                  BTN_PILL,
                  order.length === 0 && "bg-white/5 text-white/30 cursor-not-allowed hover:bg-white/5",
                )}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset order
              </button>
            </div>
            <ul className="flex flex-col gap-2">
            {displayOrder.map((id) => {
              const p = PROVIDERS.find((x) => x.id === id)
              const isDragging = dragId === id
              const isOver = overId === id && dragId !== null && dragId !== id
              return (
                <li
                  key={id}
                  ref={(el) => {
                    if (el) rowRefs.current.set(id, el)
                    else rowRefs.current.delete(id)
                  }}
                  data-provider-id={id}
                  onPointerDown={(e) => startDrag(e, id)}
                  onPointerMove={moveDrag}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  onContextMenu={(e) => e.preventDefault()}
                  className={cx(
                    "relative flex items-center gap-3 h-12 px-3 rounded-xl surface-dropdown surface-nav-drop border transition-[transform,border-color,background-color,box-shadow] duration-150 will-change-transform cursor-grab active:cursor-grabbing select-none",
                    isDragging
                      ? "touch-none scale-[1.05] bg-white/10 border-white/40 shadow-[0_10px_30px_rgba(0,0,0,0.45)] z-10"
                      : isOver
                        ? "border-white/45 bg-white/[0.06] scale-[1.02]"
                        : "border-white/10",
                  )}
                >
                  <GripVertical className="w-4 h-4 text-white/40 shrink-0" />
                  <span className="flex-1 min-w-0 truncate text-sm text-white/90">{p?.name ?? id}</span>
                  {p?.recommended && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-[#ff9f0a] shrink-0">
                      <Star className="w-3 h-3" />
                      Recommended
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
          <p className="mt-3 text-[12px] text-white/40 leading-snug">
            Your order is saved automatically and applied on every watch page.
          </p>
          </div>
        </Section>

        <Section icon={Search} title="Search" desc="Control how the search page behaves.">
          <Toggle
            on={prefs.rememberRecentSearches}
            onChange={(v) => apply({ ...prefs, rememberRecentSearches: v })}
            label="Remember Recent Searches"
            desc="Keep your recent searches for quick access."
          />
        </Section>

        <Section icon={Download} title="App" desc={`Install ${site.name} as a standalone app.`}>
          <div className="flex flex-col items-start gap-3">
            {installed ? (
              <div className="flex items-center gap-2 text-sm font-medium text-[#30d158]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {site.name} is installed.
              </div>
            ) : canInstall ? (
              <button
                onClick={requestInstall}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-white text-black border border-transparent hover:bg-white/90 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Install
              </button>
            ) : (
              <button
                disabled
                className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-white text-black/40 border border-transparent text-xs font-semibold transition-colors cursor-not-allowed"
              >
                <Download className="w-3.5 h-3.5" />
                Install
              </button>
            )}
            <p className="text-[13px] text-white/40 leading-snug">
              {canInstall
                ? "Add Movieo to your device for an app-like experience with instant access and full-screen viewing."
                : "Use your browser's menu to install the app. On iPhone or iPad, use the Share button, then \u201cAdd to Home Screen.\u201d"}
            </p>
          </div>
        </Section>

        <Section icon={ShieldCheck} title="Privacy & Data" desc="Your activity stays in this browser and never leaves your device.">
          <Toggle
            on={!prefs.trackHistory}
            onChange={(v) => apply({ ...prefs, trackHistory: !v })}
            label="Pause Watch History"
            desc="Stop saving viewing activity and using it for personalization."
          />
          <div className="mt-4 border-t border-white/[0.06]">
            <p className="text-[11px] uppercase tracking-wider text-white/30 font-semibold mt-3 mb-2">Data Management</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 py-1">
            <div className="flex items-center gap-3 min-w-0">
              <History className="w-4.5 h-4.5 text-white/50 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-white/90">Watch history</p>
                <p className="text-[13px] text-white/45 mt-0.5">
                  {historyCount === 0 ? "Nothing watched yet" : `${historyCount} title${historyCount === 1 ? "" : "s"} watched`}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => historyImportRef.current?.click()} className={BTN_PILL}>
                  <Upload className="w-3.5 h-3.5" />
                  Import
                </button>
                <input
                  ref={historyImportRef}
                  type="file"
                  accept="application/json,.json,.txt"
                  className="hidden"
                  onChange={importHistory}
                />
                <button
                  onClick={exportHistory}
                  disabled={historyCount === 0}
                  className={cx(BTN_PILL, historyCount === 0 && "bg-white/5 text-white/30 cursor-not-allowed hover:bg-white/5")}
                >
                  <Download className="w-3.5 h-3.5" />
                  Export
                </button>
                <button
                  onClick={() => setConfirming("history")}
                  disabled={historyCount === 0}
                  className={cx(
                    "inline-flex items-center gap-2 h-9 px-4 rounded-full text-xs font-semibold transition-colors cursor-pointer",
                    historyCount === 0
                      ? "bg-white/5 text-white/30 cursor-not-allowed hover:bg-white/5"
                      : "bg-red-500/15 text-red-400 hover:bg-red-500/25",
                  )}
                >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true"><path fillRule="evenodd" clipRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z"></path></svg>
                  Clear all
                </button>
              </div>
              {historySuccess !== null && <p className="text-[13px] text-[#30d158] animate-fade-in-up">{historySuccess} title{historySuccess === 1 ? "" : "s"} imported successfully</p>}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 py-1 mt-3 border-t border-white/[0.06]">
            <div className="flex items-center gap-3 min-w-0">
              <Archive className="w-4.5 h-4.5 text-white/50 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-white/90">My lists</p>
                <p className="text-[13px] text-white/45 mt-0.5">
                  {listCount === 0 ? "No lists yet" : `${listCount} list${listCount === 1 ? "" : "s"} saved`}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => importRef.current?.click()} className={BTN_PILL}>
                  <Upload className="w-3.5 h-3.5" />
                  Import
                </button>
                <input
                  ref={importRef}
                  type="file"
                  accept="application/json,.json,.txt"
                  className="hidden"
                  onChange={importLists}
                />
                <button
                  onClick={exportLists}
                  disabled={listCount === 0}
                  className={cx(BTN_PILL, listCount === 0 && "bg-white/5 text-white/30 cursor-not-allowed hover:bg-white/5")}
                >
                  <Download className="w-3.5 h-3.5" />
                  Export
                </button>
                <button
                  onClick={() => setConfirming("lists")}
                  disabled={listCount === 0}
                  className={cx(
                    "inline-flex items-center gap-2 h-9 px-4 rounded-full text-xs font-semibold transition-colors cursor-pointer",
                    listCount === 0
                      ? "bg-white/5 text-white/30 cursor-not-allowed hover:bg-white/5"
                      : "bg-red-500/15 text-red-400 hover:bg-red-500/25",
                  )}
                >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true"><path fillRule="evenodd" clipRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z"></path></svg>
                  Clear all
                </button>
              </div>
              {listSuccess !== null && <p className="text-[13px] text-[#30d158] animate-fade-in-up">{listSuccess} list{listSuccess === 1 ? "" : "s"} imported successfully</p>}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 py-1 mt-3 border-t border-white/[0.06]">
            <div className="flex items-center gap-3 min-w-0">
              <RotateCcw className="w-4.5 h-4.5 text-white/50 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-white/90">Clear storage</p>
                <p className="text-[13px] text-white/45 mt-0.5">
                  Removes recent searches, server order, and restores playback settings to defaults.
                </p>
              </div>
            </div>
            <button
              onClick={() => setConfirming("storage")}
              className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-full bg-red-500/15 text-red-400 hover:bg-red-500/25 text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>
        </Section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.05] px-6 py-5">
          <p className="text-[13px] text-white/40 leading-relaxed">
            Saved automatically on this device. Everything you change here is stored only in this
            browser&apos;s localStorage and never leaves your device.
          </p>
        </section>
      </div>

      {confirming &&
        createPortal(
          <div className="fixed inset-0 z-[160]">
            <div className="absolute inset-0 bg-black/70" />
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-label={confirmTitle}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-2rem)] max-w-sm surface-dropdown rounded-2xl shadow-2xl overflow-hidden animate-dropdown-in"
            >
              <div className="flex items-start justify-between gap-3 px-5 pt-5">
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center justify-center w-9 h-9 rounded-full bg-red-500/15 text-red-400 shrink-0">
                    <AlertTriangle className="w-4.5 h-4.5" />
                  </span>
                  <h3 className="text-sm font-semibold text-white/90">{confirmTitle}</h3>
                </div>
                <button
                  onClick={() => setConfirming(null)}
                  aria-label="Cancel"
                  className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="px-5 pt-3 text-sm text-white/50 leading-relaxed">{confirmBody}</p>
              <div className="flex items-center gap-2.5 px-5 pt-5 pb-5">
                <button
                  onClick={() => setConfirming(null)}
                  className="flex-1 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white/80 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction}
                  className="flex-1 h-10 rounded-xl bg-[#e50914] hover:bg-[#f6121d] text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}