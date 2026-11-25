import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/constants/site';
import {
  getNowPlayingMovies,
  getPopularMovies,
  getPopularTv,
  getTopRatedMovies,
  getTrending,
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
      priority: 0.8,
    },
    {
      url: `${base}/search?type=movie`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${base}/search?type=tv`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.7,
    },
  ];

  if (!isTmdbConfigured()) return staticRoutes;

  try {
    const [trending, popularMovies, topRated, nowPlaying, popularTv] = await Promise.all([
      getTrending('all', 'week'),
      getPopularMovies(),
      getTopRatedMovies(),
      getNowPlayingMovies(),
      getPopularTv(),
    ]);

    const movies = uniqueById([
      ...popularMovies.results,
      ...topRated.results,
      ...nowPlaying.results,
      ...trending.results.filter((r) => r.media_type === 'movie' || r.title),
    ]).slice(0, 120);

    const shows = uniqueById([
      ...popularTv.results,
      ...trending.results.filter((r) => r.media_type === 'tv' || r.name),
    ]).slice(0, 120);

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
