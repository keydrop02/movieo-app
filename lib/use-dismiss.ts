"use client"

import { useEffect, useRef } from "react"

export interface DismissOptions {
  /** Clicks inside this element are ignored. Omit to dismiss on any outside click. */
  rootRef?: React.RefObject<HTMLElement | null>
  /** Return true to keep the overlay open for this click target (e.g. its trigger). */
  ignore?: (target: Node) => boolean
  /** Set false to disable Escape-to-close. Defaults to true. */
  escape?: boolean
}

/**
 * Close-on-outside-click and Escape for dropdowns and menus. The callback and
 * options are held in refs so callers can pass inline values without
 * re-registering the listeners on every render.
 */
export function useDismiss(active: boolean, onDismiss: () => void, options: DismissOptions = {}) {
  const onDismissRef = useRef(onDismiss)
  const optionsRef = useRef(options)
  useEffect(() => {
    onDismissRef.current = onDismiss
    optionsRef.current = options
  })

  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if ((optionsRef.current.escape ?? true) && e.key === "Escape") onDismissRef.current()
    }
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node | null
      const { rootRef, ignore } = optionsRef.current
      if (target && ignore?.(target)) return
      if (rootRef && target && rootRef.current?.contains(target)) return
      onDismissRef.current()
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("mousedown", onMouseDown)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("mousedown", onMouseDown)
    }
  }, [active])
}
