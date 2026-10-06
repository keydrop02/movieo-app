/**
 * Failure-tolerant wrappers for TMDB reads during server rendering.
 *
 * Every one of these pages is prerendered at build time, and each depends on a
 * live third-party API. An `ECONNRESET` from TMDB mid-export previously
 * aborted the build outright (`Export encountered an error on /search/page,
 * exiting the build`), so a transient network blip turned into a failed deploy.
 *
 * The rule these helpers enforce: a missing rail is an acceptable degradation,
 * a broken build is not. Visitors see a page with fewer rows; the site's next
 * deploy is not blocked by someone else's uptime.
 */

/** Runs a loader, returning `fallback` if it throws. */
export async function safeLoad<T>(load: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await load()
  } catch {
    return fallback
  }
}
