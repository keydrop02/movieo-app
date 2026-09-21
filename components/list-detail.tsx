"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Download, List as ListIcon, Pencil, Trash2 } from "lucide-react"
import { MediaCard } from "@/components/media-card"
import { pillClass } from "@/components/pill"
import { cx } from "@/lib/utils"
import { deleteList, readLists, removeFromList, renameList, serializeListFile, subscribe, type StoredList } from "@/lib/lists"

export function ListDetail({ id }: { id: string }) {
  const [lists, setLists] = useState<StoredList[]>(() => readLists())
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(() => readLists().find((l) => l.id === id)?.name ?? "")

  useEffect(() => {
    return subscribe(() => {
      const next = readLists()
      setLists(next)
      setName(next.find((l) => l.id === id)?.name ?? "")
    })
  }, [id])

  const list = lists.find((l) => l.id === id)

  const commit = () => {
    if (name.trim()) renameList(id, name)
    setEditing(false)
  }

  const onExport = () => {
    if (!list) return
    const url = URL.createObjectURL(new Blob([serializeListFile([list])], { type: "application/json" }))
    const a = document.createElement("a")
    a.href = url
    a.download = `${list.name.replace(/[^\w\- ]/g, "").trim().replace(/\s+/g, "-") || "my-list"}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!list) {
    return (
      <div className="relative z-10 min-h-screen pt-32 px-4 max-w-6xl mx-auto">
        <div className="glass-panel flex flex-col items-center text-center px-6 py-16">
          <div className="w-16 h-16 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center mb-5">
            <ListIcon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-white/90 mb-1.5">List not found</h2>
          <p className="text-white/45 text-sm max-w-xs leading-relaxed mb-6">This list doesn&apos;t exist or was deleted.</p>
          <Link href="/lists" className={pillClass("secondary", "md")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Lists
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative z-10 min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <Link href="/lists" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          My Lists
        </Link>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 shrink-0 flex items-center justify-center">
              <ListIcon className="h-8 w-8 text-white" />
            </div>
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && commit()}
                  className="h-11 px-3 w-64 bg-white/[0.06] border border-white/10 rounded-lg text-xl font-semibold text-white outline-none focus:border-white/30"
                />
                <button onClick={commit} className="text-sm font-medium text-white/70 hover:text-white">
                  Save
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">{list.name}</h1>
                <button
                  aria-label="Rename list"
                  onClick={() => setEditing(true)}
                  className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              aria-label="Export list"
              onClick={onExport}
              className={cx(pillClass("secondary", "md"), "text-white/60 hover:text-white")}
              title="Export this list to file"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
            <button
              aria-label="Delete list"
              onClick={() => window.confirm(`Delete \u201C${list.name}\u201D?`) && deleteList(list.id)}
              className={cx(pillClass("secondary", "md"), "text-white/60 hover:text-white")}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </button>
          </div>
        </div>
        <p className="text-sm text-white/45 mt-2">
          {list.items.length} {list.items.length === 1 ? "item" : "items"}
        </p>
      </div>

      {list.items.length === 0 ? (
        <div className="glass-panel flex flex-col items-center text-center px-6 py-16 mt-2">
          <div className="w-16 h-16 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center mb-5">
            <ListIcon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-white/90 mb-1.5">This list is empty</h2>
          <p className="text-white/45 text-sm max-w-xs leading-relaxed mb-6">
            Open a movie or show and press &quot;Add to list&quot; to start collecting.
          </p>
          <Link href="/movies" className={pillClass("secondary", "md")}>
            Browse movies
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-x-4 gap-y-6">
          {list.items.map((it) => (
            <div key={`${it.kind}:${it.id}`} className="relative group/item">
<MediaCard item={it} fill />
              <button
                aria-label={`Remove ${it.title}`}
                title="Remove from list"
                onClick={() => removeFromList(list.id, it)}
                className="absolute top-2 right-2 z-[999] w-[26px] h-[26px] rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-all duration-200 hover:bg-[#e50914] hover:opacity-100"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}