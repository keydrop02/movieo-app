"use client"

import { useState } from "react"
import { cx } from "@/lib/utils"

export function PersonBio({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const long = text.length > 320
  return (
    <div>
      <p className={cx("text-sm lg:text-base text-white/70 leading-relaxed whitespace-pre-line", long && !open && "line-clamp-4")}>
        {text}
      </p>
      {long && (
        <button
          onClick={() => setOpen((v) => !v)}
          className="mt-2 text-xs font-semibold uppercase tracking-wide text-white/50 hover:text-white transition-colors cursor-pointer"
        >
          {open ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  )
}