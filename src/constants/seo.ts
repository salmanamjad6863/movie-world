/**
 * Shared SEO keywords and hub-page copy for Search Console indexing.
 */

export const SITE_KEYWORDS = [
  'free movies',
  'online movies',
  'watch movies online',
  'free seasons',
  'watch TV seasons online',
  'free TV shows',
  'stream movies',
  'stream series',
  'movies online free',
  'TV seasons free',
  'popular movies',
  'trending movies',
  'new movies online',
  'binge watch series',
  'Movie World',
] as const;

export type SeoHubSlug =
  | 'movies'
  | 'tv-shows'
  | 'free-movies'
  | 'online-movies'
  | 'free-seasons';

export type SeoHubConfig = {
  slug: SeoHubSlug;
  path: `/${SeoHubSlug}`;
  title: string;
  heading: string;
  description: string;
  keywords: string[];
  media: 'movie' | 'tv' | 'mixed';
  priority: number;
};

export const SEO_HUBS: SeoHubConfig[] = [
  {
    slug: 'movies',
    path: '/movies',
    title: 'Free Movies Online',
    heading: 'Free Movies Online',
    description:
      'Browse free movies online — popular films, now playing titles, and top-rated picks you can watch on Movie World.',
    keywords: [
      'free movies',
      'online movies',
      'watch movies online',
      'movies online free',
      'stream movies',
      'popular movies',
    ],
    media: 'movie',
    priority: 0.95,
  },
  {
    slug: 'tv-shows',
    path: '/tv-shows',
    title: 'Free TV Shows & Seasons',
    heading: 'Free TV Shows & Seasons',
    description:
      'Watch free TV seasons online. Explore popular series, airing episodes, and binge-worthy shows on Movie World.',
    keywords: [
      'free seasons',
      'free TV shows',
      'watch TV seasons online',
      'TV seasons free',
      'stream series',
      'binge watch series',
    ],
    media: 'tv',
    priority: 0.95,
  },
  {
    slug: 'free-movies',
    path: '/free-movies',
    title: 'Watch Free Movies',
    heading: 'Watch Free Movies',
    description:
      'Find free movies to watch online. Discover trending films and new releases without a complicated catalog hunt.',
    keywords: [
      'free movies',
      'watch free movies',
      'movies online free',
      'free movies to watch',
      'stream free movies',
    ],
    media: 'movie',
    priority: 0.9,
  },
  {
    slug: 'online-movies',
    path: '/online-movies',
    title: 'Online Movies to Watch',
    heading: 'Online Movies to Watch',
    description:
      'Stream online movies from popular and top-rated lists. Search thousands of titles and pick what to watch next.',
    keywords: [
      'online movies',
      'watch movies online',
      'movies online',
      'stream movies online',
      'new movies online',
    ],
    media: 'movie',
    priority: 0.9,
  },
  {
    slug: 'free-seasons',
    path: '/free-seasons',
    title: 'Free Seasons Online',
    heading: 'Free Seasons Online',
    description:
      'Watch free seasons and episodes online. Browse popular TV series, airing today titles, and full season catalogs.',
    keywords: [
      'free seasons',
      'free seasons online',
      'watch seasons free',
      'TV seasons free',
      'free episodes online',
    ],
    media: 'tv',
    priority: 0.9,
  },
];

export function getSeoHub(slug: SeoHubSlug): SeoHubConfig {
  const hub = SEO_HUBS.find((h) => h.slug === slug);
  if (!hub) throw new Error(`Unknown SEO hub: ${slug}`);
  return hub;
}
