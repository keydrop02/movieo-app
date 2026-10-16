"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Check, ChevronRight, Dices, Folder, List as ListIcon, Pencil, Plus } from "lucide-react"
import { MediaCard } from "@/components/media-card"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { TrashCan } from "@/components/trash-can"
import { pillClass } from "@/components/pill"
import { cx } from "@/lib/utils"
import { useStoredValue } from "@/lib/use-local-store"
import {
  createList,
  deleteList,
  readLists,
  removeFromList,
  renameList,
  subscribe,
  type StoredList,
} from "@/lib/lists"

const EMPTY_LISTS: StoredList[] = []

const ADJ = ["Midnight", "Neon", "Epic", "Cozy", "Dark", "Golden", "Retro", "Sunday", "Rainy", "Classic"]
const NOUNS = ["Marathon", "Bangers", "Vault", "Night", "Hits", "Picks", "Stash", "Reels", "Collection", "Favorites"]

function randomName(): string {
  return `${ADJ[Math.floor(Math.random() * ADJ.length)]} ${NOUNS[Math.floor(Math.random() * NOUNS.length)]}`
}

export function ListsPage() {
  const [lists] = useStoredValue(readLists, EMPTY_LISTS, subscribe)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [managing, setManaging] = useState<string | null>(null)
  const [draftName, setDraftName] = useState("")
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState("")
  const [error, setError] = useState("")
  const [confirming, setConfirming] = useState<StoredList | null>(null)

  const sortedLists = useMemo(
    () => [...lists].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)),
    [lists],
  )

  const toggle = (id: string) => {
    if (managing === id) return
    setExpanded((x) => ({ ...x, [id]: !x[id] }))
  }

  const startManage = (list: StoredList) => {
    setExpanded((x) => ({ ...x, [list.id]: true }))
    setDraftName(list.name)
    setError("")
    setManaging(list.id)
  }

  const submitCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const name = draft.trim()
    if (!name) return
    if (readLists().some((l) => l.name.toLowerCase() === name.toLowerCase())) {
      setError("A list with that name already exists.")
      return
    }
    const list = createList(name)
    if (!list) return
    setCreating(false)
    setDraft("")
    setError("")
    setExpanded((x) => ({ ...x, [list.id]: true }))
  }

  const submitRename = (e: React.FormEvent, id: string) => {
    e.preventDefault()
    const name = draftName.trim()
    if (!name) return
    renameList(id, name)
    setManaging(null)
  }

  const onDelete = (list: StoredList) => {
    deleteList(list.id)
    setExpanded((x) => {
      const next = { ...x }
      delete next[list.id]
      return next
    })
    setManaging(null)
    setConfirming(null)
  }

  return (
    <div className="relative z-10 min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white drop-shadow-lg">My List</h1>
            <p className="text-sm text-white/45 mt-1.5">Lists to organize your saved movies and shows.</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mb-5">
        <p className="text-sm text-white/45">
          {lists.length} {lists.length === 1 ? "list" : "lists"}
        </p>
        <button
          onClick={() => {
            setCreating((v) => !v)
            setError("")
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-dashed border-white/25 text-white/75 hover:text-white hover:bg-white/[0.08] text-[13px] font-bold transition-colors"
        >
          <Plus className="w-4 h-4" />
          New List
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {creating && (
          <div className="rounded-2xl bg-white/[0.05] border border-white/10">
            <form onSubmit={submitCreate} className="flex items-center gap-2.5 flex-wrap px-3.5 py-3.5">
              <input
                autoFocus
                maxLength={60}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="List name..."
                aria-label="List name"
                className="flex-1 min-w-[160px] h-10 px-3.5 rounded-[10px] border border-white/15 bg-white/[0.08] text-white text-[15px] placeholder:text-white/35 outline-none focus:border-white/40"
              />
              <button
                type="button"
                onClick={() => setDraft(randomName())}
                title="Generate random list name"
                aria-label="Generate random list name"
                className="w-11 h-11 shrink-0 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white inline-flex items-center justify-center transition-colors"
              >
                <Dices className="w-[18px] h-[18px]" />
              </button>
              <span className="text-xs text-white/40 min-w-[48px] text-right">{draft.length} / 60</span>
              <div className="flex items-center gap-2 ml-auto shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setCreating(false)
                    setError("")
                  }}
                  className={pillClass("secondary", "sm")}
                >
                  Cancel
                </button>
                <button type="submit" className={pillClass("primary", "sm")}>
                  Create
                </button>
              </div>
            </form>
            {error && <p className="text-[13px] text-red-500 px-3.5 pb-3 mt-0">{error}</p>}
          </div>
        )}

        {lists.length === 0 && !creating && (
          <div className="rounded-2xl bg-white/[0.05] border border-white/10 flex flex-col items-center text-center gap-1.5 py-16 px-6 text-white/40">
            <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center mb-2">
              <ListIcon className="w-5 h-5 text-white/60" />
            </div>
            <p className="text-base font-bold text-white/85">No lists yet</p>
            <p className="text-[13px] max-w-[340px] text-white/45">
              Create a list to start organizing your movies and shows, or import a list file you exported earlier.
            </p>
          </div>
        )}

        {sortedLists.map((list) => (
          <div
            key={list.id}
            className={cx("rounded-2xl bg-white/[0.05] border border-white/10", expanded[list.id] && "border-white/15")}
          >
            <div
              role="button"
              tabIndex={0}
              aria-expanded={!!expanded[list.id]}
              onClick={() => toggle(list.id)}
              onKeyDown={(e) => {
                if (e.key !== "Enter" && e.key !== " ") return
                if ((e.target as HTMLElement).closest("input, button")) return
                e.preventDefault()
                toggle(list.id)
              }}
              className="flex items-center gap-2.5 px-3.5 py-3 select-none cursor-pointer rounded-2xl focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30 flex-wrap"
            >
              <ChevronRight
                className={cx(
                  "w-[18px] h-[18px] shrink-0 text-white/60 transition-transform duration-150",
                  expanded[list.id] && "rotate-90",
                )}
              />
              {managing === list.id ? (
                <form
                  onClick={(e) => e.stopPropagation()}
                  onSubmit={(e) => submitRename(e, list.id)}
                  className="flex-1 min-w-[220px]"
                >
                  <input
                    autoFocus
                    maxLength={60}
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    aria-label="Rename list"
                    className="w-full max-w-[320px] h-9 px-3 rounded-[10px] border border-white/15 bg-white/[0.08] text-white text-sm outline-none focus:border-white/40"
                  />
                </form>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggle(list.id)
                  }}
                  className="text-left text-[15px] font-bold text-white hover:text-white/80 transition-colors truncate min-w-0 flex-1"
                >
                  {list.name}
                </button>
              )}
              <span className="text-xs text-white/40 whitespace-nowrap shrink-0 hidden sm:inline">
                {list.items.length} {list.items.length === 1 ? "item" : "items"}
              </span>
              {managing === list.id ? (
                <div className="flex items-center gap-2 ml-auto shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setConfirming(list)}
                    className="flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[13px] font-bold text-[#e50914] border border-[#e50914]/50 hover:bg-[#e50914]/15 transition-colors"
                  >
                    <TrashCan className="w-4 h-4" />
                    Delete List
                  </button>
                  <button
                    onClick={() => setManaging(null)}
                    className={cx(pillClass("secondary", "sm"), "h-9")}
                    aria-label={`Done managing ${list.name}`}
                  >
                    <Check className="w-4 h-4 mr-1.5" />
                    Done
                  </button>
                </div>
              ) : (
                <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    aria-label={`Edit ${list.name}`}
                    title="Manage list"
                    onClick={() => startManage(list)}
                    className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <Pencil className="w-[18px] h-[18px]" />
                  </button>
                </div>
              )}
            </div>

            {expanded[list.id] && (
              <div className="border-t border-white/[0.08] px-3.5 pb-3.5 pt-1 rounded-b-2xl">
                {list.items.length === 0 ? (
                  <div className="flex flex-col items-center text-center gap-1.5 py-12 px-6 text-white/40">
                    <Folder className="w-10 h-10 text-white/30" strokeWidth={1.5} />
                    <p className="mt-2 text-base font-extrabold text-white/85">This List is Empty</p>
                    <p className="text-[13px] max-w-[340px] text-white/45">
                      Add titles to &quot;{list.name}&quot; from any movie or show page.
                    </p>
                    <Link
                      href="/movies"
                      className="mt-2.5 px-5 py-2.5 rounded-full bg-white text-black font-bold text-[13px] hover:bg-white/85 transition-colors"
                    >
                      Browse movies
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-x-4 gap-y-6 pt-3">
                    {[...list.items].reverse().map((it) => (
                      <div
                        key={`${it.kind}:${it.id}`}
                        className={cx("relative group/item", managing === list.id && "animate-shake")}
                      >
                        <MediaCard item={it} fill />
                        <button
                          aria-label={`Remove ${it.title}`}
                          title="Remove from list"
                          onClick={() => removeFromList(list.id, it)}
                          className={cx(
                            "absolute top-2 right-2 z-[999] w-[26px] h-[26px] rounded-full bg-black/60 text-white flex items-center justify-center transition-all duration-200 hover:bg-[#e50914]",
                            managing === list.id ? "opacity-100" : "opacity-0",
                          )}
                        >
                          <TrashCan />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={confirming !== null}
        title="Delete list?"
        body={
          confirming ? (
            <>
              This will permanently remove &quot;{confirming.name}&quot; and its {confirming.items.length}{" "}
              {confirming.items.length === 1 ? "item" : "items"}. This can&apos;t be undone.
            </>
          ) : null
        }
        confirmLabel="Delete"
        onConfirm={() => confirming && onDelete(confirming)}
        onCancel={() => setConfirming(null)}
      />
    </div>
  )
}