"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cx } from "@/lib/utils"

const MASK = "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)"

export type ScrollRailProps = {
  children: React.ReactNode
  /** Classes for the scrolling track element. */
  className?: string
  /** Pixels to advance per arrow click. Defaults to 80% of the track width. */
  step?: number
  /** Fraction of the track to advance when `step` is not given. */
  stepRatio?: number
  /** Fade the track edges. */
  mask?: boolean
  /** Static class for the left arrow's horizontal offset, e.g. "left-4" or "-left-3". */
  insetClass?: string
  /** Static class for the right arrow's horizontal offset. */
  endInsetClass?: string
}

export function ScrollRail({
  children,
  className,
  step,
  stepRatio = 0.8,
  mask = false,
  insetClass = "left-4",
  endInsetClass = "right-4",
}: ScrollRailProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  const sync = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setCanLeft(el.scrollLeft > 4)
    setCanRight(max > 4 && el.scrollLeft < max - 4)
  }, [])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    sync()
    el.addEventListener("scroll", sync, { passive: true })
    const ro = new ResizeObserver(sync)
    ro.observe(el)
    for (const child of Array.from(el.children)) ro.observe(child)
    return () => {
      el.removeEventListener("scroll", sync)
      ro.disconnect()
    }
  }, [sync])

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    const amount = step ?? el.clientWidth * stepRatio
    el.scrollBy({ left: dir * amount, behavior: "smooth" })
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
    e.preventDefault()
    scrollBy(e.key === "ArrowLeft" ? -1 : 1)
  }

  return (
    <div className="relative group/rail">
      <RailArrow side="left" visible={canLeft} offsetClass={insetClass} onClick={() => scrollBy(-1)} />
      <RailArrow
        side="right"
        visible={canRight}
        offsetClass={endInsetClass}
        onClick={() => scrollBy(1)}
      />
      <div
        ref={trackRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        role="group"
        aria-label="Scrollable row"
        className={cx("flex overflow-x-auto overflow-y-clip scrollbar-hide items-start isolate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-lg", className)}
        style={mask ? { maskImage: MASK, WebkitMaskImage: MASK } : undefined}
      >
        {children}
      </div>
    </div>
  )
}

export function RailArrow({
  side,
  visible,
  offsetClass,
  onClick,
}: {
  side: "left" | "right"
  visible: boolean
  offsetClass: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={side === "left" ? "Scroll left" : "Scroll right"}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      disabled={!visible}
      onClick={onClick}
      className={cx(
        "hidden lg:flex absolute top-1/2 -translate-y-1/2 z-[60] w-12 h-12 items-center justify-center bg-transparent drop-shadow-lg transition-all duration-300 hover:scale-110 cursor-pointer",
        offsetClass,
        visible
          ? "opacity-0 pointer-events-none group-hover/rail:opacity-100 group-hover/rail:pointer-events-auto"
          : "opacity-0 pointer-events-none",
      )}
    >
      {side === "left" ? (
        <ChevronLeft className="w-10 h-10 text-white drop-shadow-md" />
      ) : (
        <ChevronRight className="w-10 h-10 text-white drop-shadow-md" />
      )}
    </button>
  )
}
