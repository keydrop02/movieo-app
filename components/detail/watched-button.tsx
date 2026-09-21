"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Eye, EyeOff } from "lucide-react"

const KEY = "movieo:watched"
const readWatched = (key: string): boolean => {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return false
    const set = JSON.parse(raw)
    return Array.isArray(set) && set.includes(key)
  } catch {
    return false
  }
}
const writeWatched = (key: string, watched: boolean) => {
  try {
    const raw = localStorage.getItem(KEY)
    const set: string[] = raw ? JSON.parse(raw) : []
    const next = watched ? [...new Set([...set, key])] : set.filter((k) => k !== key)
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {}
}

export function WatchedButton({ id, kind }: { id: number; kind: "movie" | "tv" }) {
  const key = `${kind}-${id}`
  const [watched, setWatched] = useState(() => readWatched(key))
  const [pop, setPop] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  const toggle = () => {
    const next = !watched
    setWatched(next)
    writeWatched(key, next)
    setPop(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setPop(false), 1500)
  }

  return (
    <div className="relative h-full flex items-center">
      <button
        onClick={toggle}
        aria-label={watched ? "Mark as not watched" : "Mark watched"}
        title={watched ? "Mark as not watched" : "Mark watched"}
        className="group/btn flex items-center justify-center h-full px-5 rounded-r-full transition-colors hover:bg-white/10 active:bg-white/20 outline-none cursor-pointer"
      >
        {watched ? (
          <Eye className="w-[18px] h-[18px] text-white" />
        ) : (
          <EyeOff className="w-[18px] h-[18px] text-white" />
        )}
      </button>
      {pop &&
        createPortal(
          <span className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] whitespace-nowrap px-3.5 py-2 rounded-full bg-white text-black text-xs font-semibold shadow-xl animate-fade-in-up pointer-events-none">
            {watched ? "Marked as watched" : "Removed from watched"}
          </span>,
          document.body,
        )}
    </div>
  )
}