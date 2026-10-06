"use client"

import { useLayoutEffect, useRef } from "react"

const LG_BREAKPOINT = 1024
const ANCHOR_SELECTOR = "[data-hero-actions]"

/**
 * Anchors the detail hero's right column to the bottom edge of the action-button
 * row, so the panel starts where the buttons end rather than beside them, and
 * stays put regardless of how tall the left column grows (expanding the overview,
 * for instance). Below lg the slot returns to normal flow, since the mobile hero
 * stacks both columns.
 *
 * Placement is written straight to the node rather than held in state: it only
 * ever needs to change when the anchor or the column above it moves, and
 * avoiding a second render means the panel never paints at a stale offset.
 */
export function HeroPanelSlot({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const resolve = () => {
      if (window.innerWidth < LG_BREAKPOINT) return { row: null, anchor: null }
      const row = el.closest<HTMLElement>("[data-hero-row]")
      const anchor = row?.querySelector<HTMLElement>(ANCHOR_SELECTOR) ?? null
      if (!row || !anchor) return { row: null, anchor: null }
      return { row, anchor }
    }

    const ro = new ResizeObserver(() => place())

    // Targets are re-resolved on every placement and re-observed whenever they
    // change. Resolving once at mount left the slot tracking a stale anchor:
    // crossing the lg breakpoint, or the overview expanding and shifting the
    // action row, meant the observer was still watching nodes that were no
    // longer in the layout and the panel stayed at its old offset.
    let observed: Array<HTMLElement> = []

    const observe = () => {
      const { row, anchor } = resolve()
      const wanted = [row ?? el, anchor].filter((n): n is HTMLElement => !!n)
      const same =
        wanted.length === observed.length &&
        wanted.every((node, i) => node === observed[i])
      if (same) return
      for (const node of observed) ro.unobserve(node)
      observed = wanted
      for (const node of observed) ro.observe(node)
    }

    function place() {
      // Captured as a const: `el` is narrowed by the early return above, but
      // TypeScript does not carry that narrowing into a hoisted function body.
      const node = el
      if (!node) return
      observe()
      const { row, anchor } = resolve()
      if (!row || !anchor) {
        node.style.position = ""
        node.style.top = ""
        return
      }
      const offset = Math.round(anchor.getBoundingClientRect().bottom - row.getBoundingClientRect().top)
      node.style.position = "absolute"
      node.style.top = `${offset}px`
    }

    place()

    const onAssetLoad = (e: Event) => {
      if (e.target instanceof HTMLImageElement) place()
    }
    // Delegated on the row, which itself can be replaced across renders.
    el.closest<HTMLElement>("[data-hero-row]")?.addEventListener("load", onAssetLoad, true)

    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts
    fonts?.ready.then(place).catch(() => {})

    window.addEventListener("resize", place)
    return () => {
      ro.disconnect()
      el.closest<HTMLElement>("[data-hero-row]")?.removeEventListener("load", onAssetLoad, true)
      window.removeEventListener("resize", place)
    }
  }, [])

  return (
    <div ref={ref} className="w-full lg:right-16 lg:w-[280px] lg:z-10">
      {children}
    </div>
  )
}
