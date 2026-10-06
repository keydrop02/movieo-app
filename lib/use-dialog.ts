"use client"

import { useEffect, useRef } from "react"

/**
 * Shared modal behaviour: dialog semantics, focus containment, focus restore,
 * Escape to close, and scroll locking.
 *
 * Every overlay in the app previously handled some subset of this ad hoc. None
 * moved focus into the dialog or trapped it, and `document.body.style.overflow`
 * was written directly, so two overlapping overlays could unlock the page while
 * one was still open. Centralising it fixes all of them at once.
 */

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",")

/** Depth counter so nested overlays only release the page when the last one closes. */
let lockDepth = 0
let savedOverflow: string | null = null

function lockScroll() {
  if (lockDepth === 0) {
    savedOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
  }
  lockDepth += 1
}

function unlockScroll() {
  lockDepth = Math.max(0, lockDepth - 1)
  if (lockDepth === 0) {
    document.body.style.overflow = savedOverflow ?? ""
    savedOverflow = null
  }
}

function focusableWithin(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement,
  )
}

/**
 * @param open    whether the dialog is currently rendered
 * @param onClose invoked on Escape or backdrop activation
 * @returns a ref to attach to the dialog element (the one carrying role="dialog")
 */
export function useDialog<T extends HTMLElement = HTMLDivElement>(open: boolean, onClose: () => void) {
  const dialogRef = useRef<T>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return

    const returnFocusTo = document.activeElement as HTMLElement | null
    lockScroll()

    const node = dialogRef.current
    if (node) {
      const initial = focusableWithin(node)[0] ?? node
      // Defer so the element exists and its own layout has settled.
      const raf = requestAnimationFrame(() => initial.focus({ preventScroll: true }))
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          event.stopPropagation()
          onCloseRef.current()
          return
        }
        if (event.key !== "Tab") return

        const focusable = focusableWithin(dialogRef.current as HTMLElement)
        if (focusable.length === 0) {
          event.preventDefault()
          return
        }
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        const activeEl = document.activeElement as HTMLElement | null

        // Wrap at both ends so focus cannot escape into the page behind.
        if (event.shiftKey && (activeEl === first || !dialogRef.current?.contains(activeEl))) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && (activeEl === last || !dialogRef.current?.contains(activeEl))) {
          event.preventDefault()
          first.focus()
        }
      }

      node.addEventListener("keydown", onKeyDown)

      return () => {
        cancelAnimationFrame(raf)
        node.removeEventListener("keydown", onKeyDown)
        unlockScroll()
        // Return focus to whatever opened the dialog so keyboard users are not
        // dropped at the top of the document.
        if (returnFocusTo && document.contains(returnFocusTo)) {
          returnFocusTo.focus({ preventScroll: true })
        }
      }
    }

    unlockScroll()
    return undefined
  }, [open])

  return dialogRef
}

/** Props every dialog surface should carry. Spread onto the dialog element. */
export const dialogProps = {
  role: "dialog" as const,
  "aria-modal": true as const,
}
