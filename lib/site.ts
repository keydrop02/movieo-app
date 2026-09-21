export type SiteConfig = {
  name: string
  tagline: string
  url: string
  description: string
}

export const site: SiteConfig = {
  name: "Movieo",
  tagline: "Movies, Shows & More",
  url: "https://movieo.example",
  description:
    "Movieo - the ultimate destination for movies and TV shows. Stream or download your favorite titles in high quality.",
}

export const SITE_TITLE = site.tagline
export const SITE_NAME = site.name