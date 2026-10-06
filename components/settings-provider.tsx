"use client"

import { useEffect } from "react"
import { applyPrefs, PREFS_KEY, readPrefs } from "@/lib/prefs"
import { useErrorReporter } from "@/lib/error-reporting"

export function SettingsProvider() {
  useErrorReporter()

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