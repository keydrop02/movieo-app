"use client"

export function BackgroundLayer() {
  return (
    <div
      aria-hidden
      className="liquid-bg"
      style={{
        background: "radial-gradient(at 100% 0%, rgba(99, 102, 241, 0.15) 0px, transparent 50%), #0b0f19",
        contain: "strict",
      }}
    />
  )
}