/**
 * Custom `next/image` loader for TMDB artwork.
 *
 * The default loader routes every image through `/_next/image`, which resizes
 * on the server with `sharp`. That endpoint does not exist on the Cloudflare
 * Workers runtime this site deploys to, so `next/image` would either 404 or
 * silently fall back to an unoptimized original for every poster on the site.
 *
 * TMDB already serves pre-rendered renditions at fixed widths. This loader maps
 * the width `next/image` asks for onto the nearest available bucket and points
 * the browser straight at `image.tmdb.org`, which gives real `srcset` bandwidth
 * savings with no server involvement.
 */

const TMDB_ORIGIN = "https://image.tmdb.org/t/p/"

/**
 * Rendition widths TMDB publishes, ascending. A request below `original` is
 * served from the first bucket that is at least as large as requested, since
 * upscaling a smaller rendition costs bandwidth and looks no better.
 *
 * TMDB will render any of these for any image path, so one ladder covers both
 * posters and backdrops; the wide buckets are what a 16:9 backdrop needs at
 * desktop sizes.
 */
const WIDTHS = [92, 154, 185, 300, 342, 500, 780, 1280]

export default function tmdbLoader({ src, width }: { src: string; width: number }) {
  // Only TMDB artwork has bucketed renditions to swap. Other hosts (the YouTube
  // thumbnail, data URIs) are returned with a cache-busting query so Next does
  // not see the loader hand back the identical `src` and warn that it does not
  // implement width: for those sources the answer really is "the only size there
  // is", and the warning would be noise in every console.
  if (!src.startsWith(TMDB_ORIGIN)) return `${src}${src.includes("?") ? "&" : "?"}w=${width}`

  const path = src.slice(TMDB_ORIGIN.length)
  const slash = path.indexOf("/")
  if (slash === -1) return src

  // `src` arrives pre-baked from `lib/tmdb/images.ts` as `w500/<file>`. TMDB
  // bucket names carry a `w` prefix (`w92`, not `92`); dropping it returns
  // 400 from the CDN and every image on the site fails to load.
  const size = WIDTHS.find((candidate) => width <= candidate)
  if (size === undefined) return `${TMDB_ORIGIN}original${path.slice(slash)}`
  return `${TMDB_ORIGIN}w${size}${path.slice(slash)}`
}
