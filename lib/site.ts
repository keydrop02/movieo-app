export type SiteConfig = {
  name: string
  tagline: string
  url: string
  description: string
  /**
   * Contact address published on the legal pages and used as the DMCA/licensing
   * contact. Set via `NEXT_PUBLIC_CONTACT_EMAIL`. A placeholder is used rather
   * than a real-looking address so nobody's inbox receives takedown notices.
   */
  contactEmail: string
}

/**
 * Canonical origin, used for `metadataBase`, Open Graph URLs, the sitemap, and
 * the robots sitemap reference. Previously hardcoded to `movieo.example`, so
 * every absolute URL the site emitted pointed at a domain that does not exist.
 */
function resolveSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (configured) {
    // Normalise so callers always get an origin without a trailing slash.
    return configured.replace(/\/+$/, "")
  }
  return "https://movieo.app"
}

export const site: SiteConfig = {
  name: "Movieo",
  tagline: "Movies, Shows & More",
  url: resolveSiteUrl(),
  description:
    "Movieo - the ultimate destination for movies and TV shows. Stream or download your favorite titles in high quality.",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "contact@example.com",
}

export const SITE_TITLE = site.tagline
export const SITE_NAME = site.name