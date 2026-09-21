export const PREFS_KEY = "movieo:prefs"

export type Prefs = {
  themeId: string
  reducedMotion: boolean
  showImageLogos: boolean
  trackHistory: boolean
  trackProgress: boolean
}

export const THEME_IDS = [
  "default",
  "aero",
  "ember",
  "royal",
  "noir",
  "ocean",
  "obsidian",
] as const

export const DEFAULT_PREFS: Prefs = { themeId: "default", reducedMotion: false, showImageLogos: true, trackHistory: true, trackProgress: true }

export function isThemeId(v: unknown): v is (typeof THEME_IDS)[number] {
  return typeof v === "string" && (THEME_IDS as readonly string[]).includes(v)
}

export function readPrefs(): Prefs {
  if (typeof window === "undefined") return DEFAULT_PREFS
  try {
    const raw = window.localStorage.getItem(PREFS_KEY)
    if (!raw) return DEFAULT_PREFS
    const p = JSON.parse(raw) as Partial<Prefs>
    return {
      themeId: isThemeId(p.themeId) ? p.themeId : DEFAULT_PREFS.themeId,
      reducedMotion: typeof p.reducedMotion === "boolean" ? p.reducedMotion : DEFAULT_PREFS.reducedMotion,
      showImageLogos: typeof p.showImageLogos === "boolean" ? p.showImageLogos : DEFAULT_PREFS.showImageLogos,
      trackHistory: typeof p.trackHistory === "boolean" ? p.trackHistory : DEFAULT_PREFS.trackHistory,
      trackProgress: typeof p.trackProgress === "boolean" ? p.trackProgress : DEFAULT_PREFS.trackProgress,
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
  el.setAttribute("data-theme-id", prefs.themeId)
  el.setAttribute("data-theme", prefs.themeId)
  el.setAttribute("data-reduced-motion", prefs.reducedMotion ? "on" : "off")
  el.setAttribute("data-show-logos", prefs.showImageLogos ? "on" : "off")
}