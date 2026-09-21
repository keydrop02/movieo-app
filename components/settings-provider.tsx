"use client"

import { useEffect } from "react"
import { applyPrefs, PREFS_KEY, readPrefs } from "@/lib/prefs"

export function SettingsProvider() {
  useEffect(() => {
    applyPrefs(readPrefs())
    const onStorage = (e: StorageEvent) => {
      if (e.key === PREFS_KEY) applyPrefs(readPrefs())
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])
  return null
}