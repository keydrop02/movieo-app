"use client"

import { useEffect, useState } from "react"
import { ArrowUp } from "lucide-react"
import { cx } from "@/lib/utils"

export function ScrollTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <button
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cx(
        "fixed right-4 bottom-[92px] lg:right-8 lg:bottom-8 z-[90] flex items-center justify-center w-11 h-11 rounded-full glass-dropdown border border-white/10 text-white/80 hover:text-white shadow-lg shadow-black/30 transition-all duration-300 cursor-pointer",
        visible ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-3 pointer-events-none",
      )}
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  )
}