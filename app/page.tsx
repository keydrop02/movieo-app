import { cache } from "react"
import { HeroCarousel } from "@/components/hero"
import { ContinueWatching } from "@/components/continue-watching"
import { ForYou } from "@/components/home/for-you"
import { PosterRow, ProviderTileRow } from "@/components/rows"
import { discover, getGenres, getMovieCategory, getProvidersList, getTitleLogos, getTrending, getTvCategory } from "@/lib/tmdb/client"
import { site } from "@/lib/site"

/**
 * Runs a rail fetch without letting it take down the page.
 *
 * The home page issues every request through one `Promise.all`, so a single
 * TMDB hiccup on any one of the ~20 rails rejected the whole render and the
 * visitor got an error page instead of a home page with one empty rail. A
 * degraded row is a far better failure mode than a 500.
 */
async function rail<T>(load: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await load()
  } catch {
    return fallback
  }
}

const GENRE_RAILS: Array<{ title: string; genre: string }> = [
  { title: "Mystery Movies", genre: "9648" },
  { title: "Action Movies", genre: "28" },
  { title: "Laugh Out Loud", genre: "35" },
  { title: "Horror Movies", genre: "27" },
  { title: "Sci-Fi & Fantasy", genre: "878,14" },
  { title: "Crime Movies", genre: "80" },
  { title: "Documentaries", genre: "99" },
  { title: "Animation Movies", genre: "16" },
  { title: "Thriller Movies", genre: "53" },
  { title: "Heartwarming Romance", genre: "10749" },
  { title: "Western Movies", genre: "37" },
  { title: "War Movies", genre: "10752" },
]

/**
 * `cache` deduplicates identical calls within a single render pass. The genre
 * rails overlap heavily, so several distinct keys previously mapped onto the
 * same TMDB endpoint and were fetched once per key.
 */
const loadTrendingMovies = cache(() => getTrending("movie"))
const loadTrendingShows = cache(() => getTrending("tv"))

export default async function HomePage() {
  const [
    heroMovies,
    heroShows,
    providers,
    nowPlaying,
    popularShows,
    topMovies,
    topShows,
    airingToday,
    onTheAir,
    movieGenres,
    tvGenres,
    ...genreRails
  ] = await Promise.all([
    rail(loadTrendingMovies, []),
    rail(loadTrendingShows, []),
    rail(getProvidersList, []),
    rail(() => getMovieCategory("now_playing"), []),
    rail(() => getTvCategory("popular"), []),
    rail(() => getMovieCategory("top_rated"), []),
    rail(() => getTvCategory("top_rated"), []),
    rail(() => getTvCategory("airing_today"), []),
    rail(() => getTvCategory("on_the_air"), []),
    rail(() => getGenres("movie"), []),
    rail(() => getGenres("tv"), []),
    ...GENRE_RAILS.map((r) => rail(() => discover("movie", { genre: r.genre }), { items: [], page: 1, totalPages: 1 })),
  ])

  const hero = [...heroMovies.slice(0, 4), ...heroShows.slice(0, 2)]
  const genreNames = Object.fromEntries([...movieGenres, ...tvGenres].map((g) => [g.id, g.name]))
  // Logos are a progressive enhancement; if the lookup fails the hero still
  // renders with plain text titles.
  const titleLogos = await rail(() => getTitleLogos(hero), {} as Record<number, string | null>)

  if (hero.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-xl font-semibold text-white">{site.tagline}</h1>
        <p className="text-sm text-white/60">We couldn&apos;t reach the movie service right now. Please try again shortly.</p>
      </div>
    )
  }

  return (
    <div className="relative">
      <HeroCarousel items={hero} titleLogos={titleLogos} genreNames={genreNames} />

      <div className="relative z-10 pb-24 pt-4 lg:pt-12 min-h-[500px]">
        <div className="space-y-8 lg:space-y-12">
          <ContinueWatching />

          <ProviderTileRow providers={providers} />

          <ForYou />

          <PosterRow header={{ title: "Trending Movies" }} items={heroMovies} />
          <PosterRow header={{ title: "Trending TV Shows" }} items={heroShows} />
          <PosterRow header={{ title: "New Movies" }} items={nowPlaying} />
          <PosterRow header={{ title: "Popular TV Shows" }} items={popularShows} />

          {genreRails[0]?.items.length ? <PosterRow header={{ title: GENRE_RAILS[0].title }} items={genreRails[0].items} /> : null}
          <PosterRow header={{ title: "Top Rated Movies" }} items={topMovies} />
          <PosterRow header={{ title: "Top Rated TV Shows" }} items={topShows} />
          {GENRE_RAILS.slice(1).map((cfg, i) =>
            genreRails[i + 1]?.items.length ? (
              <PosterRow key={cfg.title} header={{ title: cfg.title }} items={genreRails[i + 1].items} />
            ) : null,
          )}

          <PosterRow header={{ title: "Airing Today" }} items={airingToday} />
          <PosterRow header={{ title: "On The Air" }} items={onTheAir} />
        </div>
      </div>
    </div>
  )
}