export const PREFS_KEY = "movieo:prefs"

export type Prefs = {
  reducedMotion: boolean
  showImageLogos: boolean
  trackHistory: boolean
  trackProgress: boolean
  showContinueWatching: boolean
  showForYou: boolean
  autoPlayNext: boolean
  autoSkipIntros: boolean
  spoilerShield: boolean
  rememberRecentSearches: boolean
}

export const DEFAULT_PREFS: Prefs = {
  reducedMotion: false,
  showImageLogos: true,
  trackHistory: true,
  trackProgress: true,
  showContinueWatching: true,
  showForYou: true,
  autoPlayNext: true,
  autoSkipIntros: false,
  spoilerShield: false,
  rememberRecentSearches: true,
}

export function readPrefs(): Prefs {
  if (typeof window === "undefined") return DEFAULT_PREFS
  try {
    const raw = window.localStorage.getItem(PREFS_KEY)
    if (!raw) return DEFAULT_PREFS
    const p = JSON.parse(raw) as Partial<Prefs>
    return {
      reducedMotion: typeof p.reducedMotion === "boolean" ? p.reducedMotion : DEFAULT_PREFS.reducedMotion,
      showImageLogos: typeof p.showImageLogos === "boolean" ? p.showImageLogos : DEFAULT_PREFS.showImageLogos,
      trackHistory: typeof p.trackHistory === "boolean" ? p.trackHistory : DEFAULT_PREFS.trackHistory,
      trackProgress: typeof p.trackProgress === "boolean" ? p.trackProgress : DEFAULT_PREFS.trackProgress,
      showContinueWatching:
        typeof p.showContinueWatching === "boolean" ? p.showContinueWatching : DEFAULT_PREFS.showContinueWatching,
      showForYou: typeof p.showForYou === "boolean" ? p.showForYou : DEFAULT_PREFS.showForYou,
      autoPlayNext: typeof p.autoPlayNext === "boolean" ? p.autoPlayNext : DEFAULT_PREFS.autoPlayNext,
      autoSkipIntros: typeof p.autoSkipIntros === "boolean" ? p.autoSkipIntros : DEFAULT_PREFS.autoSkipIntros,
      spoilerShield: typeof p.spoilerShield === "boolean" ? p.spoilerShield : DEFAULT_PREFS.spoilerShield,
      rememberRecentSearches:
        typeof p.rememberRecentSearches === "boolean" ? p.rememberRecentSearches : DEFAULT_PREFS.rememberRecentSearches,
    }
  } catch {
    return DEFAULT_PREFS
  }
}

export function writePrefs(prefs: Prefs): void {
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch {}
}

export function applyPrefs(prefs: Prefs): void {
  if (typeof document === "undefined") return
  const el = document.documentElement
  el.setAttribute("data-reduced-motion", prefs.reducedMotion ? "on" : "off")
  el.setAttribute("data-show-logos", prefs.showImageLogos ? "on" : "off")
  el.setAttribute("data-spoiler-shield", prefs.spoilerShield ? "on" : "off")
}