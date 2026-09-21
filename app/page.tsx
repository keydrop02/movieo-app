import { HeroCarousel } from "@/components/hero"
import { ContinueWatching } from "@/components/continue-watching"
import { PosterRow, ProviderTileRow } from "@/components/rows"
import { discover, getGenres, getMovieCategory, getProvidersList, getTitleLogos, getTrending, getTvCategory } from "@/lib/tmdb/client"

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

export default async function HomePage() {
  const [heroMovies, heroShows, providers, nowPlaying, popularShows, topMovies, topShows, airingToday, onTheAir, movieGenres, tvGenres, ...genreRails] =
    await Promise.all([
      getTrending("movie"),
      getTrending("tv"),
      getProvidersList(),
      getMovieCategory("now_playing"),
      getTvCategory("popular"),
      getMovieCategory("top_rated"),
      getTvCategory("top_rated"),
      getTvCategory("airing_today"),
      getTvCategory("on_the_air"),
      getGenres("movie"),
      getGenres("tv"),
      ...GENRE_RAILS.map((r) => discover("movie", { genre: r.genre })),
    ])
  const hero = [...heroMovies.slice(0, 4), ...heroShows.slice(0, 2)]
  const genreNames = Object.fromEntries([...movieGenres, ...tvGenres].map((g) => [g.id, g.name]))
  const titleLogos = await getTitleLogos(hero)

  return (
    <div className="relative">
      <HeroCarousel items={hero} titleLogos={titleLogos} genreNames={genreNames} />

      <div className="relative z-10 pb-24 pt-4 lg:pt-12 min-h-[500px]">
        <div className="space-y-8 lg:space-y-12">
          <ContinueWatching />

          <ProviderTileRow providers={providers} />

          <PosterRow header={{ title: "Trending Movies" }} items={heroMovies} />
          <PosterRow header={{ title: "Trending TV Shows" }} items={heroShows} />
          <PosterRow header={{ title: "New Movies" }} items={nowPlaying} />
          <PosterRow header={{ title: "Popular TV Shows" }} items={popularShows} />

          {GENRE_RAILS[0] && <PosterRow header={{ title: GENRE_RAILS[0].title }} items={genreRails[0].items} />}
          <PosterRow header={{ title: "Top Rated Movies" }} items={topMovies} />
          <PosterRow header={{ title: "Top Rated TV Shows" }} items={topShows} />
          {GENRE_RAILS.slice(1).map((rail, i) => (
            <PosterRow key={rail.title} header={{ title: rail.title }} items={genreRails[i + 1].items} />
          ))}

          <PosterRow header={{ title: "Airing Today" }} items={airingToday} />
          <PosterRow header={{ title: "On The Air" }} items={onTheAir} />
        </div>
      </div>
    </div>
  )
}