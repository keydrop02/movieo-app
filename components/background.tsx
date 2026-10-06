"use client"

export function BackgroundLayer() {
  return (
    <div
      aria-hidden
      className="liquid-bg"
      style={{
        background: "var(--background)",
        contain: "strict",
      }}
    />
  )
}