"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Check, Plus, X } from "lucide-react"
import type { MediaItem } from "@/lib/tmdb/types"
import { addToList, createList, isInList, readLists, subscribe, toggleInList, type StoredList } from "@/lib/lists"
import { img } from "@/lib/tmdb/images"
import { cx } from "@/lib/utils"

export function AddToListPopover({
  label = "Add to list",
  item,
  triggerClass = "flex items-center justify-center px-5 h-full rounded-l-full transition-colors hover:bg-white/10 active:bg-white/20 outline-none cursor-pointer",
}: {
  label?: string
  item?: MediaItem
  triggerClass?: string
}) {
  const [open, setOpen] = useState(false)
  const [lists, setLists] = useState<StoredList[]>(() => readLists())
  const [creating, setCreating] = useState(false)
  const [pending, setPending] = useState("")
  const wrapRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const mobilePanelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return subscribe(() => setLists(readLists()))
  }, [])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (
        wrapRef.current &&
        !wrapRef.current.contains(e.target as Node) &&
        !panelRef.current?.contains(e.target as Node) &&
        !mobilePanelRef.current?.contains(e.target as Node)
      )
        setOpen(false)
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

  const commit = () => {
    const next = createList(pending)
    if (!next) return
    if (item) addToList(next.id, item)
    setPending("")
    setCreating(false)
  }

  return (
    <div ref={wrapRef} className="relative flex h-full">
      <button
        type="button"
        className={cx(
          "flex flex-1 items-center justify-center h-full w-full outline-none",
          triggerClass ?? "px-5 rounded-l-full cursor-pointer transition-colors hover:bg-white/10 active:bg-white/20"
        )}
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Plus className="w-5 h-5 text-white" aria-hidden />
      </button>

      {open && (
        <>
          <div
            ref={panelRef}
            className="hidden sm:absolute sm:block sm:top-full sm:mt-2 sm:w-72 sm:max-w-none z-[100] sm:left-0 sm:right-auto
                       bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10
                       rounded-xl shadow-2xl
                       flex flex-col sm:max-h-[min(60vh,440px)] overflow-hidden"
          >
            <Content
              item={item}
              lists={lists}
              creating={creating}
              pending={pending}
              onPending={setPending}
              onCommit={commit}
              onCreateToggle={() => setCreating((v) => !v)}
            />
          </div>
          {typeof document !== "undefined" &&
            createPortal(
              <div className="fixed inset-0 z-[101] sm:hidden">
                <div role="presentation" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <div
                    ref={mobilePanelRef}
                    className="w-full max-w-sm bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10
                               rounded-xl shadow-2xl
                               flex flex-col max-h-[calc(100dvh-2rem)] overflow-hidden"
                  >
                    <Content
                      item={item}
                      lists={lists}
                      creating={creating}
                      pending={pending}
                      onPending={setPending}
                      onCommit={commit}
                      onCreateToggle={() => setCreating((v) => !v)}
                    />
                  </div>
                </div>
              </div>,
              document.body
            )}
        </>
      )}
    </div>
  )
}

function Content({
  item,
  lists,
  creating,
  pending,
  onPending,
  onCommit,
  onCreateToggle,
}: {
  item?: MediaItem
  lists: StoredList[]
  creating: boolean
  pending: string
  onPending: (v: string) => void
  onCommit: () => void
  onCreateToggle: () => void
}) {
  return (
    <>
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/90">{item ? "Add to List" : "Your Lists"}</h3>
        {item?.title && <span className="text-xs text-white/40 truncate max-w-[10rem]">{item.title}</span>}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto popover-scrollbar">
        {lists.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <div className="w-10 h-10 mx-auto rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center mb-3">
              <Plus className="w-4 h-4 text-white/50" />
            </div>
            <p className="text-sm text-white/60 font-medium">No lists yet</p>
            <p className="mt-1 text-xs text-white/40">Create your first list below</p>
          </div>
        ) : (
          lists.map((l) => {
            const added = item ? isInList(l.id, item) : false
            return (
              <button
                key={l.id}
                onClick={() => {
                  if (item) toggleInList(l.id, item)
                }}
                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-3 hover:bg-white/10 cursor-pointer ${
                  added ? "text-white" : "text-white/80"
                }`}
              >
                {l.items[0]?.poster_path ? (
                  <img src={img(l.items[0].poster_path, "w92") ?? undefined} alt="" className="w-8 h-8 rounded-md object-cover bg-white/[0.06] shrink-0" />
                ) : (
                  <span className="w-8 h-8 rounded-md bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0">
                    <Plus className="w-3.5 h-3.5 text-white/30" />
                  </span>
                )}
                <span className="truncate flex-1">{l.name}</span>
                {added ? (
                  <Check className="w-4 h-4 text-white shrink-0" />
                ) : (
                  <span className="text-[10px] text-white/35 tabular-nums shrink-0">{l.items.length}</span>
                )}
              </button>
            )
          })
        )}
      </div>
      <div className="border-t border-white/10">
        {creating && (
          <div className="px-4 pt-3 pb-3 animate-dropdown-in">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">
              New list
            </span>
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={pending}
                onChange={(e) => onPending(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onCommit()}
                placeholder="Name your list"
                className="flex-1 min-w-0 h-10 px-3.5 text-sm bg-white/[0.08] border border-white/10 rounded-xl text-white placeholder:text-white/35 outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition-all"
              />
              <button
                onClick={onCommit}
                disabled={!pending.trim()}
                className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl theme-btn-primary disabled:bg-white/10 disabled:text-white/40 hover:scale-[1.03] active:scale-90 shadow-lg shadow-black/20 transition-all cursor-pointer disabled:cursor-not-allowed"
                aria-label="Create list"
                title="Create list"
              >
                <Check className="w-[18px] h-[18px]" strokeWidth={3} />
              </button>
              <button
                onClick={() => {
                  onPending("")
                  onCreateToggle()
                }}
                className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-white/[0.06] text-white/60 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
                aria-label="Cancel"
                title="Cancel"
              >
                <X className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}
        {!creating && (
          <button
            onClick={onCreateToggle}
            className="w-full text-left px-4 py-3 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed rounded-b-xl cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create New List
          </button>
        )}
      </div>
    </>
  )
}