export interface IntroSegment {
  start: number
  end: number
}

/**
 * Known intro/recap timing for a specific episode, keyed by `tv:{id}:s{season}e{episode}`.
 * Embeds and providers can register ranges here; the watch player auto-seeks past
 * them when the "Auto-skip Intros & Recaps" preference is enabled. Empty by
 * default, so the preference is a no-op until timing data is supplied.
 */
const KEY = "movieo:episode-timings"

type TimingMap = Record<string, IntroSegment>

function read(): TimingMap {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object") return {}
    return parsed as TimingMap
  } catch {
    return {}
  }
}

function write(map: TimingMap) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map))
  } catch {}
}

export function episodeKey(id: number, season: number, episode: number): string {
  return `tv:${id}:s${season}e${episode}`
}

export function getEpisodeIntro(id: number, season: number, episode: number): IntroSegment | null {
  return read()[episodeKey(id, season, episode)] ?? null
}

export function setEpisodeIntro(id: number, season: number, episode: number, segment: IntroSegment | null) {
  const map = read()
  const key = episodeKey(id, season, episode)
  if (segment === null) {
    delete map[key]
  } else {
    map[key] = segment
  }
  write(map)
}

export function clearEpisodeTimings() {
  try {
    window.localStorage.removeItem(KEY)
  } catch {}
}