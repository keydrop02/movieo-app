"use client"

import type { ReactNode } from "react"
import { createPortal } from "react-dom"
import { AlertTriangle, X } from "lucide-react"
import { useDialog } from "@/lib/use-dialog"

/**
 * Destructive-action confirmation shared by My Lists, Watch History, and
 * Settings. Previously each page duplicated the portal, the icon header, and an
 * outside-click effect whose ref was never attached (so it never fired). This
 * keeps one implementation, closes on backdrop click, and gets Escape, focus
 * trapping, and scroll locking from `useDialog`.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  body: ReactNode
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const dialogRef = useDialog<HTMLDivElement>(open, onCancel)
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[160]">
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-2rem)] max-w-sm surface-dropdown rounded-2xl shadow-2xl overflow-hidden animate-dropdown-in"
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-9 h-9 rounded-full bg-red-500/15 text-red-400 shrink-0">
              <AlertTriangle className="w-4.5 h-4.5" />
            </span>
            <h3 className="text-sm font-semibold text-white/90">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            aria-label="Cancel"
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="px-5 pt-3 text-sm text-white/50 leading-relaxed">{body}</p>
        <div className="flex items-center gap-2.5 px-5 pt-5 pb-5">
          <button
            onClick={onCancel}
            className="flex-1 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white/80 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-10 rounded-xl bg-[#e50914] hover:bg-[#f6121d] text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
