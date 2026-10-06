"use client"

import { useCallback, useSyncExternalStore } from "react"
import Link from "next/link"
import { Play } from "lucide-react"
import { PillButton } from "@/components/pill"
import { getHistory } from "@/lib/watch-store"

const noopSubscribe = () => () => {}

function isInHistory(id: number, kind: "movie" | "tv"): boolean {
  try {
    return getHistory().some((h) => h.id === id && h.type === kind)
  } catch {
    return false
  }
}

export function PlayButton({
  id,
  kind,
  href,
  className,
}: {
  id: number
  kind: "movie" | "tv"
  href: string
  className?: string
}) {
  const getSnapshot = useCallback(() => isInHistory(id, kind), [id, kind])
  const inHistory = useSyncExternalStore(noopSubscribe, getSnapshot, () => false)

  return (
    <Link href={href}>
      <PillButton size="md" className={className}>
        <Play className="w-5 h-5 mr-1.5 fill-current" />
        <span>{inHistory ? "Resume" : "Play"}</span>
      </PillButton>
    </Link>
  )
}
