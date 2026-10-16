export interface EmbedSource {
  id: string
  label: string
  kind: string
  url: string
}

export interface EmbedProvider {
  id: string
  name: string
  recommended?: boolean
  capabilities: { movie: boolean; tv: boolean }
  movie: (id: string, startAt?: number, bust?: string) => string
  tv: (id: string, season: number, episode: number, startAt?: number, bust?: string) => string
  kind: string
}

const providers: EmbedProvider[] = [
  {
    id: "cinesrc",
    name: "CineSrc",
    recommended: true,
    capabilities: { movie: true, tv: true },
    movie: (id, startAt) => `https://cinesrc.st/embed/movie/${id}` + (startAt ? `?t=${Math.floor(startAt)}` : ""),
    tv: (id, s, e, startAt) =>
      `https://cinesrc.st/embed/tv/${id}?s=${s}&e=${e}` + (startAt ? `&t=${Math.floor(startAt)}` : ""),
    kind: "cinesrc",
  },
  {
    id: "vidfast",
    name: "VidFast",
    capabilities: { movie: true, tv: true },
    // The .pro host 301-redirects here; framing .pro would be blocked because the
    // redirect target (this host) is not in the frame-src policy. Link directly.
    movie: (id, _startAt, bust) =>
      `https://vidfast.vc/movie/${id}?autoPlay=true&nextButton=false` + (bust ? `&${bust}` : ""),
    tv: (id, s, e, _startAt, bust) =>
      `https://vidfast.vc/tv/${id}/${s}/${e}?autoPlay=true&nextButton=false` + (bust ? `&${bust}` : ""),
    kind: "vidfast",
  },
  {
    id: "vidlove",
    name: "VidLove",
    capabilities: { movie: true, tv: true },
    movie: (id, _startAt, bust) => `https://player.vidlove.cc/embed/movie/${id}` + (bust ? `?${bust}` : ""),
    tv: (id, s, e, _startAt, bust) => `https://player.vidlove.cc/embed/tv/${id}/${s}/${e}` + (bust ? `?${bust}` : ""),
    kind: "vidlove",
  },
  {
    id: "xpass",
    name: "XPass",
    capabilities: { movie: true, tv: true },
    movie: (id, _startAt, bust) => `https://play.xpass.top/e/movie/${id}` + (bust ? `?${bust}` : ""),
    tv: (id, s, e, _startAt, bust) => `https://play.xpass.top/e/tv/${id}/${s}/${e}` + (bust ? `?${bust}` : ""),
    kind: "xpass",
  },
  {
    id: "vidup",
    name: "VidUp",
    capabilities: { movie: true, tv: true },
    movie: (id, startAt, bust) => {
      const q = startAt ? `?startAt=${Math.floor(startAt)}&` : "?"
      return `https://vidup.to/movie/${id}${q}nextButton=false` + (bust ? `&${bust}` : "")
    },
    tv: (id, s, e, startAt, bust) => {
      const q = startAt ? `?startAt=${Math.floor(startAt)}&` : "?"
      return `https://vidup.to/tv/${id}/${s}/${e}${q}nextButton=false` + (bust ? `&${bust}` : "")
    },
    kind: "vidup",
  },
]

function orderedProviders(): EmbedProvider[] {
  return providers.slice().sort((a, b) => {
    if (a.recommended !== b.recommended) return a.recommended ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}

export function getEmbedSources(ctx: {
  type: "movie" | "tv"
  tmdbId: number
  season?: number
  episode?: number
  startAt?: number
  bust?: string
}): EmbedSource[] {
  if (!Number.isInteger(ctx.tmdbId) || ctx.tmdbId <= 0) return []
  if (ctx.type === "tv" && (!Number.isInteger(ctx.season) || !Number.isInteger(ctx.episode))) return []
  const startAt = ctx.startAt && ctx.startAt > 0 ? Math.floor(ctx.startAt) : undefined
  // `bust` is only ever an internal cache-buster (`_fresh=...`); drop anything
  // that could add a second query parameter or path segment if a future caller
  // wires it to user input.
  const bust = ctx.bust && /^[\w-]+=[\w.-]+$/.test(ctx.bust) ? ctx.bust : undefined
  return orderedProviders()
    .filter((p) => p.capabilities[ctx.type])
    .map((p) => ({
      id: p.id,
      label: p.name,
      kind: p.kind,
      url:
        ctx.type === "movie"
          ? p.movie(String(ctx.tmdbId), startAt, bust)
          : p.tv(String(ctx.tmdbId), ctx.season!, ctx.episode!, startAt, bust),
    }))
}

export function getProviders(): EmbedProvider[] {
  return orderedProviders()
}