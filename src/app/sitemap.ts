import type { MetadataRoute } from 'next';
import { SEO_HUBS } from '@/constants/seo';
import { SITE_URL } from '@/constants/site';
import {
  getAiringTodayTv,
  getNowPlayingMovies,
  getOnTheAirTv,
  getPopularMovies,
  getPopularTv,
  getTopRatedMovies,
  getTopRatedTv,
  getTrending,
  getUpcomingMovies,
  isTmdbConfigured,
} from '@/lib/tmdb';

export const revalidate = 3600;

function uniqueById<T extends { id: number }>(items: T[]): T[] {
  const seen = new Set<number>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

async function fetchPages<T>(
  loader: (page: number) => Promise<{ results: T[] }>,
  pages: number
): Promise<T[]> {
  const responses = await Promise.all(
    Array.from({ length: pages }, (_, i) => loader(i + 1).catch(() => ({ results: [] as T[] })))
  );
  return responses.flatMap((r) => r.results);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL.replace(/\/$/, '');
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${base}/search`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.75,
    },
    ...SEO_HUBS.map((hub) => ({
      url: `${base}${hub.path}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: hub.priority,
    })),
  ];

  if (!isTmdbConfigured()) return staticRoutes;

  try {
    const [
      trending,
      popularMovies,
      topRatedMovies,
      nowPlaying,
      upcoming,
      popularTv,
      topRatedTv,
      airing,
      onTheAir,
    ] = await Promise.all([
      getTrending('all', 'week'),
      fetchPages(getPopularMovies, 5),
      fetchPages(getTopRatedMovies, 3),
      fetchPages(getNowPlayingMovies, 2),
      fetchPages(getUpcomingMovies, 2),
      fetchPages(getPopularTv, 5),
      fetchPages(getTopRatedTv, 3),
      fetchPages(getAiringTodayTv, 2),
      fetchPages(getOnTheAirTv, 2),
    ]);

    const movies = uniqueById([
      ...popularMovies,
      ...topRatedMovies,
      ...nowPlaying,
      ...upcoming,
      ...trending.results.filter((r) => r.media_type === 'movie' || Boolean(r.title)),
    ]).slice(0, 500);

    const shows = uniqueById([
      ...popularTv,
      ...topRatedTv,
      ...airing,
      ...onTheAir,
      ...trending.results.filter((r) => r.media_type === 'tv' || Boolean(r.name && !r.title)),
    ]).slice(0, 500);

    const movieRoutes: MetadataRoute.Sitemap = movies.map((movie) => ({
      url: `${base}/movie/${movie.id}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
      images: movie.poster_path
        ? [`https://image.tmdb.org/t/p/w500${movie.poster_path}`]
        : undefined,
    }));

    const tvRoutes: MetadataRoute.Sitemap = shows.map((show) => ({
      url: `${base}/tv/${show.id}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
      images: show.poster_path
        ? [`https://image.tmdb.org/t/p/w500${show.poster_path}`]
        : undefined,
    }));

    return [...staticRoutes, ...movieRoutes, ...tvRoutes];
  } catch {
    return staticRoutes;
  }
}
