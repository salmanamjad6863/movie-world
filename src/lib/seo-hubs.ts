import { getSeoHub, type SeoHubSlug } from '@/constants/seo';
import { SITE_NAME, absoluteUrl } from '@/constants/site';
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
import type { Metadata } from 'next';
import type { MediaType, TmdbMediaListItem } from '@/types/tmdb';

function uniqueById(items: TmdbMediaListItem[]): TmdbMediaListItem[] {
  const seen = new Set<number>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function buildHubMetadata(slug: SeoHubSlug): Metadata {
  const hub = getSeoHub(slug);
  const url = absoluteUrl(hub.path);
  const title = hub.title;
  const description = hub.description;

  return {
    title,
    description,
    keywords: [...hub.keywords, SITE_NAME],
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url,
      type: 'website',
      siteName: SITE_NAME,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_NAME}`,
      description,
    },
    robots: { index: true, follow: true },
  };
}

export async function loadHubCatalog(slug: SeoHubSlug): Promise<{
  configured: boolean;
  primary: TmdbMediaListItem[];
  secondary: TmdbMediaListItem[];
  secondaryTitle: string;
  forceType?: MediaType;
}> {
  if (!isTmdbConfigured()) {
    return {
      configured: false,
      primary: [],
      secondary: [],
      secondaryTitle: '',
    };
  }

  switch (slug) {
    case 'movies': {
      const [popular, nowPlaying, topRated] = await Promise.all([
        getPopularMovies(),
        getNowPlayingMovies(),
        getTopRatedMovies(),
      ]);
      return {
        configured: true,
        primary: uniqueById([...popular.results, ...nowPlaying.results]).slice(0, 36),
        secondary: topRated.results.slice(0, 18),
        secondaryTitle: 'Top rated free movies',
        forceType: 'movie',
      };
    }
    case 'free-movies': {
      const [trending, popular, upcoming] = await Promise.all([
        getTrending('movie', 'week'),
        getPopularMovies(),
        getUpcomingMovies(),
      ]);
      return {
        configured: true,
        primary: uniqueById([...trending.results, ...popular.results]).slice(0, 36),
        secondary: upcoming.results.slice(0, 18),
        secondaryTitle: 'Coming soon online',
        forceType: 'movie',
      };
    }
    case 'online-movies': {
      const [nowPlaying, topRated, popular] = await Promise.all([
        getNowPlayingMovies(),
        getTopRatedMovies(),
        getPopularMovies(2),
      ]);
      return {
        configured: true,
        primary: uniqueById([...nowPlaying.results, ...popular.results]).slice(0, 36),
        secondary: topRated.results.slice(0, 18),
        secondaryTitle: 'Highest rated online movies',
        forceType: 'movie',
      };
    }
    case 'tv-shows': {
      const [popular, airing, topRated] = await Promise.all([
        getPopularTv(),
        getAiringTodayTv(),
        getTopRatedTv(),
      ]);
      return {
        configured: true,
        primary: uniqueById([...popular.results, ...airing.results]).slice(0, 36),
        secondary: topRated.results.slice(0, 18),
        secondaryTitle: 'Top rated free seasons',
        forceType: 'tv',
      };
    }
    case 'free-seasons': {
      const [onAir, popular, topRated] = await Promise.all([
        getOnTheAirTv(),
        getPopularTv(),
        getTopRatedTv(),
      ]);
      return {
        configured: true,
        primary: uniqueById([...onAir.results, ...popular.results]).slice(0, 36),
        secondary: topRated.results.slice(0, 18),
        secondaryTitle: 'Must-watch free seasons',
        forceType: 'tv',
      };
    }
  }
}
