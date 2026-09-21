export type MediaKind = "movie" | "tv"

export type ProviderType = "flatrate" | "rent" | "buy" | "free"

export interface MediaItem {
  id: number
  kind: MediaKind
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string | null
  vote_average: number
  vote_count: number
  popularity: number
  genre_ids?: number[]
  adult?: boolean
}

export interface Person {
  id: number
  name: string
  profile_path: string | null
  character?: string | null
  job?: string | null
  order?: number
}

export interface Video {
  id: string
  name: string
  key: string
  site: string
  type: string
  size?: number
  official?: boolean
}

export interface Genre {
  id: number
  name: string
}

export interface Season {
  id: number
  name: string
  season_number: number
  overview: string
  air_date: string | null
  episode_count: number
  poster_path: string | null
  vote_average: number
}

export interface Episode {
  id: number
  name: string
  season_number: number
  episode_number: number
  overview: string
  air_date: string | null
  runtime: number | null
  still_path: string | null
  vote_average: number
  vote_count: number
}

export interface ProviderOption {
  provider_id: number
  provider_name: string
  logo_path: string
  display_priority: number
  item_type: ProviderType
}

export interface WatchProvider {
  id: number
  name: string
  logo_path: string
}

export interface MediaDetail extends MediaItem {
  tagline: string
  status: string
  original_language: string
  genres: Genre[]
  runtime: number | null
  certification: string | null
  directors: Person[]
  creators: Person[]
  cast: Person[]
  videos: Video[]
  similar: MediaItem[]
  providers: ProviderOption[]
  title_logo: string | null
  collection: {
    id: number
    name: string
    backdrop_path: string | null
    poster_path: string | null
    parts: MediaItem[]
  } | null
  seasons?: Season[]
  number_of_seasons?: number
  number_of_episodes?: number
  original_languages?: string[]
  homepage?: string | null
  budget?: number
  revenue?: number
}

export interface TmdbConfiguration {
  images: {
    base_url: string
    secure_base_url: string
    backdrop_sizes: string[]
    logo_sizes: string[]
    poster_sizes: string[]
    profile_sizes: string[]
    still_sizes: string[]
  }
}