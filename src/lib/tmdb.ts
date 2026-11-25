/**
 * TMDB API v3 client (server-side)
 * Docs: https://developer.themoviedb.org/reference/intro/getting-started
 */

import type {
  MediaType,
  TmdbMediaListItem,
  TmdbMovieDetails,
  TmdbPagedResponse,
  TmdbSeasonDetails,
  TmdbTvDetails,
} from '@/types/tmdb';

const TMDB_BASE = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export class TmdbConfigError extends Error {
  constructor(message = 'TMDB_API_KEY is not set. Add it to .env.local') {
    super(message);
    this.name = 'TmdbConfigError';
  }
}

function getAuth(): { apiKey?: string; bearer?: string } {
  const apiKey = process.env.TMDB_API_KEY?.trim();
  const bearer = process.env.TMDB_READ_ACCESS_TOKEN?.trim();
  return { apiKey: apiKey || undefined, bearer: bearer || undefined };
}

export function isTmdbConfigured(): boolean {
  const { apiKey, bearer } = getAuth();
  return Boolean(apiKey || bearer);
}

async function tmdbFetch<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const { apiKey, bearer } = getAuth();
  if (!apiKey && !bearer) throw new TmdbConfigError();

  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set('language', 'en-US');
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  }
  if (apiKey) url.searchParams.set('api_key', apiKey);

  const headers: HeadersInit = { Accept: 'application/json' };
  if (bearer) headers.Authorization = `Bearer ${bearer}`;

  const res = await fetch(url.toString(), {
    headers,
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`TMDB ${path} failed (${res.status}): ${body.slice(0, 200)}`);
  }

  return res.json() as Promise<T>;
}

export function posterUrl(path: string | null | undefined, size: 'w185' | 'w342' | 'w500' | 'original' = 'w342'): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function backdropUrl(path: string | null | undefined, size: 'w780' | 'w1280' | 'original' = 'w1280'): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function mediaTitle(item: Pick<TmdbMediaListItem, 'title' | 'name'>): string {
  return item.title || item.name || 'Untitled';
}

export function mediaYear(item: Pick<TmdbMediaListItem, 'release_date' | 'first_air_date'>): string {
  const date = item.release_date || item.first_air_date || '';
  return date.slice(0, 4);
}

export function resolveMediaType(item: TmdbMediaListItem, fallback: MediaType = 'movie'): MediaType {
  if (item.media_type === 'tv' || item.media_type === 'movie') return item.media_type;
  if (item.name && !item.title) return 'tv';
  return fallback;
}

export async function getTrending(
  mediaType: 'all' | MediaType = 'all',
  timeWindow: 'day' | 'week' = 'week',
  page = 1
): Promise<TmdbPagedResponse<TmdbMediaListItem>> {
  return tmdbFetch(`/trending/${mediaType}/${timeWindow}`, { page });
}

export async function getPopularMovies(page = 1): Promise<TmdbPagedResponse<TmdbMediaListItem>> {
  return tmdbFetch('/movie/popular', { page });
}

export async function getPopularTv(page = 1): Promise<TmdbPagedResponse<TmdbMediaListItem>> {
  return tmdbFetch('/tv/popular', { page });
}

export async function getTopRatedMovies(page = 1): Promise<TmdbPagedResponse<TmdbMediaListItem>> {
  return tmdbFetch('/movie/top_rated', { page });
}

export async function getNowPlayingMovies(page = 1): Promise<TmdbPagedResponse<TmdbMediaListItem>> {
  return tmdbFetch('/movie/now_playing', { page });
}

export async function getAiringTodayTv(page = 1): Promise<TmdbPagedResponse<TmdbMediaListItem>> {
  return tmdbFetch('/tv/airing_today', { page });
}

export async function searchMulti(query: string, page = 1): Promise<TmdbPagedResponse<TmdbMediaListItem>> {
  return tmdbFetch('/search/multi', { query, page, include_adult: 'false' });
}

export async function searchMovies(query: string, page = 1): Promise<TmdbPagedResponse<TmdbMediaListItem>> {
  return tmdbFetch('/search/movie', { query, page, include_adult: 'false' });
}

export async function searchTv(query: string, page = 1): Promise<TmdbPagedResponse<TmdbMediaListItem>> {
  return tmdbFetch('/search/tv', { query, page, include_adult: 'false' });
}

export async function getMovie(id: number | string): Promise<TmdbMovieDetails> {
  return tmdbFetch(`/movie/${id}`);
}

export async function getTv(id: number | string): Promise<TmdbTvDetails> {
  return tmdbFetch(`/tv/${id}`);
}

export async function getMovieRecommendations(
  id: number | string,
  page = 1
): Promise<TmdbPagedResponse<TmdbMediaListItem>> {
  return tmdbFetch(`/movie/${id}/recommendations`, { page });
}

export async function getMovieSimilar(
  id: number | string,
  page = 1
): Promise<TmdbPagedResponse<TmdbMediaListItem>> {
  return tmdbFetch(`/movie/${id}/similar`, { page });
}

export async function getTvRecommendations(
  id: number | string,
  page = 1
): Promise<TmdbPagedResponse<TmdbMediaListItem>> {
  return tmdbFetch(`/tv/${id}/recommendations`, { page });
}

export async function getTvSimilar(
  id: number | string,
  page = 1
): Promise<TmdbPagedResponse<TmdbMediaListItem>> {
  return tmdbFetch(`/tv/${id}/similar`, { page });
}

/** Prefer recommendations; fall back to similar titles when empty. */
export async function getMovieSuggested(
  id: number | string,
  limit = 18
): Promise<TmdbMediaListItem[]> {
  try {
    const recs = await getMovieRecommendations(id);
    if (recs.results?.length) return recs.results.slice(0, limit);
  } catch {
    // fall through
  }
  try {
    const similar = await getMovieSimilar(id);
    return (similar.results || []).slice(0, limit);
  } catch {
    return [];
  }
}

export async function getTvSuggested(
  id: number | string,
  limit = 18
): Promise<TmdbMediaListItem[]> {
  try {
    const recs = await getTvRecommendations(id);
    if (recs.results?.length) return recs.results.slice(0, limit);
  } catch {
    // fall through
  }
  try {
    const similar = await getTvSimilar(id);
    return (similar.results || []).slice(0, limit);
  } catch {
    return [];
  }
}

export async function getTvSeason(
  tvId: number | string,
  seasonNumber: number | string
): Promise<TmdbSeasonDetails> {
  return tmdbFetch(`/tv/${tvId}/season/${seasonNumber}`);
}

export type TmdbExternalIds = {
  imdb_id: string | null;
  tvdb_id?: number | null;
  wikidata_id?: string | null;
};

export async function getMovieExternalIds(id: number | string): Promise<TmdbExternalIds> {
  return tmdbFetch(`/movie/${id}/external_ids`);
}

export async function getTvExternalIds(id: number | string): Promise<TmdbExternalIds> {
  return tmdbFetch(`/tv/${id}/external_ids`);
}

export async function getTvEpisodeExternalIds(
  tvId: number | string,
  season: number | string,
  episode: number | string
): Promise<TmdbExternalIds> {
  return tmdbFetch(`/tv/${tvId}/season/${season}/episode/${episode}/external_ids`);
}
