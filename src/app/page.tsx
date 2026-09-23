import { HeroBanner } from '@/components/home/HeroBanner';
import { MediaRow } from '@/components/media/MediaRow';
import { TmdbMissingKey } from '@/components/ui/TmdbMissingKey';
import {
  getAiringTodayTv,
  getNowPlayingMovies,
  getPopularMovies,
  getPopularTv,
  getTopRatedMovies,
  getTrending,
  isTmdbConfigured,
  TmdbConfigError,
} from '@/lib/tmdb';
import type { TmdbMediaListItem } from '@/types/tmdb';

export const revalidate = 3600;

async function loadHome() {
  if (!isTmdbConfigured()) return { configured: false as const };

  const [trending, popularMovies, popularTv, topRated, nowPlaying, airing] = await Promise.all([
    getTrending('all', 'week'),
    getPopularMovies(),
    getPopularTv(),
    getTopRatedMovies(),
    getNowPlayingMovies(),
    getAiringTodayTv(),
  ]);

  const trendingFiltered = trending.results.filter(
    (r) => r.media_type === 'movie' || r.media_type === 'tv'
  ) as TmdbMediaListItem[];

  const hero =
    trendingFiltered.find((r) => r.backdrop_path) ||
    trendingFiltered[0] ||
    popularMovies.results[0];

  return {
    configured: true as const,
    hero,
    trending: trendingFiltered,
    popularMovies: popularMovies.results,
    popularTv: popularTv.results,
    topRated: topRated.results,
    nowPlaying: nowPlaying.results,
    airing: airing.results,
  };
}

export default async function Home() {
  let data: Awaited<ReturnType<typeof loadHome>>;
  try {
    data = await loadHome();
  } catch (err) {
    if (err instanceof TmdbConfigError) {
      return (
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-4 py-16">
          <TmdbMissingKey />
        </main>
      );
    }
    throw err;
  }

  if (!data.configured) {
    return (
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-4 py-16">
        <TmdbMissingKey />
      </main>
    );
  }

  return (
    <main className="flex-1">
      {data.hero && <HeroBanner item={data.hero} />}

      <div className="relative z-10 -mt-6 space-y-12 pb-20 sm:-mt-10 sm:space-y-14">
        <MediaRow title="Trending Now" items={data.trending.slice(0, 18)} />
        <MediaRow title="Popular Movies" items={data.popularMovies.slice(0, 18)} forceType="movie" />
        <MediaRow title="Now Playing" items={data.nowPlaying.slice(0, 18)} forceType="movie" />
        <MediaRow title="Top Rated Films" items={data.topRated.slice(0, 18)} forceType="movie" />
        <MediaRow title="Popular Series" items={data.popularTv.slice(0, 18)} forceType="tv" />
        <MediaRow title="Airing Today" items={data.airing.slice(0, 18)} forceType="tv" />
      </div>
    </main>
  );
}
