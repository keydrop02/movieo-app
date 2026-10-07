"use client"

import { useEffect } from "react"
import { applyPrefs, PREFS_KEY, readPrefs } from "@/lib/prefs"
import { useErrorReporter } from "@/lib/error-reporting"
// Attach the `beforeinstallprompt` listener as early as possible so the prompt
// survives until the settings page mounts and subscribes.
import "@/lib/install-prompt"

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