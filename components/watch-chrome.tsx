"use client"

import { useEffect } from "react"

export function WatchChrome() {
  useEffect(() => {
    document.documentElement.classList.add("route-watch")
    return () => document.documentElement.classList.remove("route-watch")
  }, [])
  return null
}