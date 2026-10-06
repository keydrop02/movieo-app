"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { cx } from "@/lib/utils"

export function OverviewText({
  text,
  clampClass = "line-clamp-2",
  className,
}: {
  text?: string | null
  clampClass?: string
  className?: string
}) {
  const [expanded, setExpanded] = useState(false)
  const [clamped, setClamped] = useState(false)
  const ref = useRef<HTMLParagraphElement>(null)

  const measure = useCallback(() => {
    const el = ref.current
    if (!el) return
    setClamped(el.scrollHeight > el.clientHeight + 2)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el || expanded) return
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [measure, expanded])

  if (!text) return null

  return (
    <div className={className}>
      <p
        ref={ref}
        className={cx(
          "text-sm lg:text-base text-white/70 leading-relaxed text-center lg:text-left",
          !expanded && clampClass,
        )}
      >
        {text}
      </p>
      {clamped && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-2 text-xs font-semibold uppercase tracking-wide text-white/50 hover:text-white transition-colors cursor-pointer"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  )
}
