"use client"

import { useEffect } from "react"

type Level = "info" | "warn" | "error"

/**
 * Minimal error reporting hook.
 *
 * With no accounts and no server-side user data there is nobody to email an
 * error to, so client-side failures were previously invisible: a failed search
 * or a 502 from an API route looked identical to "no results". This reports to
 * Sentry when `NEXT_PUBLIC_SENTRY_DSN` is configured and degrades to a console
 * warning otherwise, so it is safe to call unconditionally.
 */
export function useErrorReporter() {
  useEffect(() => {
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
    if (!dsn) {
      // Unhandled rejections and window errors still deserve a trace in the
      // browser console during development and self-hosted deployments.
      const onError = (event: ErrorEvent) => {
        console.warn("[movieo] uncaught error:", event.error ?? event.message)
      }
      const onRejection = (event: PromiseRejectionEvent) => {
        console.warn("[movieo] unhandled rejection:", event.reason)
      }
      window.addEventListener("error", onError)
      window.addEventListener("unhandledrejection", onRejection)
      return () => {
        window.removeEventListener("error", onError)
        window.removeEventListener("unhandledrejection", onRejection)
      }
    }

    // The SDK is loaded from a CDN rather than bundled. That keeps this module
    // dependency-free: the site has no monitoring package installed, and adding
    // one just for this hook would pull it into the build for every deployment,
    // including self-hosted ones that never set a DSN.
    const SENTRY_SDK = "https://browser.sentry-cdn.com/7.120.0/bundle.tracing.min.js"
    let cancelled = false

    const script = document.createElement("script")
    script.src = SENTRY_SDK
    script.async = true
    script.onload = () => {
      if (cancelled) return
      const sentry = getSentry()
      if (!sentry) return
      sentry.init({
        dsn,
        tracesSampleRate: 0,
        // Media URLs are long and numerous; without this, event payloads become
        // dominated by query strings.
        beforeSend(event: SentryEvent) {
          const url = event?.request?.url
          if (!url) return event
          try {
            const parsed = new URL(url)
            parsed.search = ""
            event.request!.url = parsed.toString()
          } catch {
            /* leave the url untouched if it will not parse */
          }
          return event
        },
      })
    }
    script.onerror = () => {
      // Reporting is best-effort and must never break the page.
    }
    document.head.appendChild(script)

    return () => {
      cancelled = true
    }
  }, [])
}

type SentryEvent = { request?: { url?: string } }
type SentryApi = {
  init: (options: Record<string, unknown>) => void
  captureException: (error: unknown, context?: unknown) => void
  captureMessage: (message: string, context?: unknown) => void
}

function getSentry(): SentryApi | null {
  const sentry = (window as unknown as { Sentry?: SentryApi }).Sentry
  return sentry ?? null
}

/** Route a caught failure to the configured reporter, if any. */
export function reportError(scope: string, error: unknown, level: Level = "error") {
  const message = error instanceof Error ? error.message : String(error)
  if (level === "error") {
    console.error(`[movieo] ${scope}:`, error)
  } else {
    console.warn(`[movieo] ${scope}:`, error)
  }

  if (!process.env.NEXT_PUBLIC_SENTRY_DSN || typeof window === "undefined") return

  const sentry = getSentry()
  if (!sentry) return

  const context = { tags: { scope } }
  if (error instanceof Error) sentry.captureException(error, context)
  else sentry.captureMessage(message, context)
}
