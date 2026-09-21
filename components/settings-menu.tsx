"use client"

import Link from "next/link"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { Flame, History, Settings } from "lucide-react"
import { cx } from "@/lib/utils"

const MENU_ITEMS = [
  { label: "Settings", href: "/settings", Icon: Settings },
  { label: "Watch History", href: "/watch-history", Icon: History },
  { label: "Shorts", href: "/shorts", Icon: Flame },
]

export function SettingsMenu({
  open,
  onClose,
  anchorRef,
}: {
  open: boolean
  onClose: () => void
  anchorRef?: React.RefObject<HTMLElement | null>
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; right: number }>({ top: 79, right: 55 })

  useLayoutEffect(() => {
    if (!open || !anchorRef?.current) return
    const rect = anchorRef.current.getBoundingClientRect()
    setPos({
      top: Math.round(rect.bottom + 10),
      right: Math.round(window.innerWidth - rect.right),
    })
  }, [open, anchorRef])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node | null
      if (t instanceof Element && t.closest("[data-profile-trigger]")) return
      if (ref.current && !ref.current.contains(t)) onClose()
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("mousedown", onClick)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("mousedown", onClick)
    }
}, [open, onClose])

  if (!open) return null

  return (
    <div ref={ref}>
      <div className="profile-portal-menu fixed z-[2147483000] w-56 rounded-xl glass-dropdown theme-glass-drop overflow-hidden flex flex-col py-1 pointer-events-none hidden lg:flex"
        style={pos}
      >
        {items("px-4 py-2.5", onClose)}
      </div>
      <div
        role="none"
        className="fixed left-1/2 -translate-x-1/2 w-56 rounded-2xl overflow-hidden flex flex-col py-1 z-[60] pointer-events-none theme-glass-tint backdrop-blur-[20px] backdrop-saturate-150 border border-white/10 shadow-2xl mobile-profile-menu lg:hidden"
      >
        {items("px-4 py-3", onClose)}
      </div>
    </div>
  )
}

function items(cls: string, onClose: () => void) {
  return (
    <>
      {MENU_ITEMS.map(({ label, href, Icon }) => (
        <div key={label} className="flex flex-col">
          <Link
            href={href}
            onClick={onClose}
            className={cx(
              "flex items-center gap-3 text-sm text-white/90 hover:bg-white/10 transition-colors text-left w-full pointer-events-auto",
              cls,
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        </div>
      ))}
    </>
  )
}