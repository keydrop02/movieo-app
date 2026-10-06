"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Check, ChevronDown } from "lucide-react"
import { img } from "@/lib/tmdb/images"
import { cx } from "@/lib/utils"

export type DropOption<T extends string | number> = {
  value: T
  label: string
  logoPath?: string
  logoUrl?: string
  desc?: string
}

export function FilterDropdown<T extends string | number>({
  options,
  selected,
  onSelect,
  label,
  triggerClass = "filter-trigger",
}: {
  options: DropOption<T>[]
  selected: T
  onSelect: (value: T) => void
  label: string
  triggerClass?: string
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
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

  const current = options.find((o) => o.value === selected)

  return (
    <div ref={rootRef} className={cx("relative filter-dropdown min-w-0 md:flex-none", triggerClass)}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center justify-center sm:justify-between gap-1 h-10 px-3 sm:px-4 bg-[#232326] border border-[#2c2c2f] rounded-full text-white hover:bg-[#2c2c2f] transition-all text-sm shrink-0 whitespace-nowrap cursor-pointer min-w-0"
      >
        {label && (
          <span className="flex items-center gap-2 text-white/50 font-medium hidden sm:inline">
            {label}
            <span className="text-white/30">·</span>
          </span>
        )}
        <span className="font-medium">
          {current && current.logoPath ? (
            <span className="flex items-center gap-1.5">
              <Image src={img(current.logoPath, "w154") ?? ""} width={16} height={16} alt="" className={cx("w-4 h-4 rounded-full object-cover bg-white/10")} />
              {current.label}
            </span>
          ) : current?.logoUrl ? (
            <span className="flex items-center gap-1.5">
              <Image src={current.logoUrl} width={16} height={16} alt="" className="w-4 h-4 rounded-full object-cover bg-white/10" />
              {current.label}
            </span>
          ) : (
            current?.label ?? label
          )}
        </span>
        <ChevronDown className="w-4 h-4 text-white/50 shrink-0 ml-1" />
      </button>

      {open && (
        <div className="absolute top-full mt-2 w-full min-w-[180px] max-w-[calc(100vw-1.5rem)] surface-nav-drop rounded-xl shadow-2xl overflow-hidden z-50 left-0 animate-dropdown-in">
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar py-1">
            {options.map((opt) => {
              const isSel = opt.value === selected
              return (
                <button
                  key={String(opt.value)}
                  data-selected={isSel}
                  onClick={() => {
                    onSelect(opt.value)
                    setOpen(false)
                  }}
                  aria-selected={isSel}
                  role="option"
                  className={cx(
                    "w-full text-left px-4 py-2.5 text-sm font-medium transition-colors hover:bg-white/10 flex items-center justify-between group/item",
                    isSel ? "text-white bg-white/5" : "text-white/70 hover:text-white",
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {opt.logoPath ? (
                      <>
                        <Image src={img(opt.logoPath, "w154") ?? ""} width={24} height={24} alt="" className="w-6 h-6 rounded-full object-cover bg-white/10 shrink-0" />
                        <span className="truncate">{opt.label}</span>
                      </>
                    ) : opt.logoUrl ? (
                      <>
                        <Image src={opt.logoUrl} width={24} height={24} alt="" className="w-6 h-6 rounded-full object-cover bg-white/10 shrink-0" />
                        <span className="truncate">{opt.label}</span>
                      </>
                    ) : (
                      <span className="ml-0.5 truncate">{opt.label}</span>
                    )}
                    {opt.desc && <span className="text-xs text-white/35 truncate">{opt.desc}</span>}
                  </div>
                  {isSel && (
                    <span className="text-white shrink-0 ml-2">
                      <Check className="w-4 h-4" strokeWidth={3} />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
