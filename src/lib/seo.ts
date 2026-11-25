import type { Metadata } from 'next';
import { backdropUrl, posterUrl } from '@/lib/tmdb';
import { SITE_NAME, SITE_URL, absoluteUrl } from '@/constants/site';

function truncate(text: string | null | undefined, max = 160): string | undefined {
  if (!text) return undefined;
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

type OgImage = {
  url: string;
  width: number;
  height: number;
  alt: string;
};

export function mediaOpenGraphImage(
  backdropPath: string | null | undefined,
  posterPath: string | null | undefined
): OgImage[] | undefined {
  const backdrop = backdropUrl(backdropPath, 'w1280');
  const poster = posterUrl(posterPath, 'w500');
  const src = backdrop || poster;
  if (!src) return undefined;
  return [
    {
      url: src,
      width: backdrop ? 1280 : 500,
      height: backdrop ? 720 : 750,
      alt: SITE_NAME,
    },
  ];
}

export function buildMediaMetadata(input: {
  title: string;
  description?: string | null;
  path: string;
  type: 'movie' | 'tv' | 'website';
  backdropPath?: string | null;
  posterPath?: string | null;
  noIndex?: boolean;
}): Metadata {
  const description = truncate(input.description) || `Watch ${input.title} on ${SITE_NAME}.`;
  const url = absoluteUrl(input.path);
  const images = mediaOpenGraphImage(input.backdropPath, input.posterPath);
  const twitterImages = images?.map((img) => (typeof img === 'string' ? img : String(img.url)));

  return {
    title: input.title,
    description,
    alternates: { canonical: url },
    robots: input.noIndex
      ? { index: false, follow: true, googleBot: { index: false, follow: true } }
      : { index: true, follow: true },
    openGraph: {
      type: input.type === 'website' ? 'website' : 'video.other',
      url,
      siteName: SITE_NAME,
      title: `${input.title} | ${SITE_NAME}`,
      description,
      images,
      locale: 'en_US',
    },
    twitter: {
      card: images ? 'summary_large_image' : 'summary',
      title: `${input.title} | ${SITE_NAME}`,
      description,
      images: twitterImages,
    },
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL.replace(/\/$/, '')}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl('/icon.png'),
  };
}

export function movieJsonLd(input: {
  id: string | number;
  title: string;
  description?: string | null;
  posterPath?: string | null;
  backdropPath?: string | null;
  releaseDate?: string | null;
  rating?: number | null;
}) {
  const image = posterUrl(input.posterPath, 'w500') || backdropUrl(input.backdropPath, 'w1280');
  return {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: input.title,
    description: truncate(input.description, 300),
    url: absoluteUrl(`/movie/${input.id}`),
    image: image || undefined,
    datePublished: input.releaseDate || undefined,
    aggregateRating:
      input.rating && input.rating > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: Number(input.rating.toFixed(1)),
            bestRating: 10,
            worstRating: 0,
          }
        : undefined,
  };
}

export function tvSeriesJsonLd(input: {
  id: string | number;
  name: string;
  description?: string | null;
  posterPath?: string | null;
  backdropPath?: string | null;
  firstAirDate?: string | null;
  rating?: number | null;
}) {
  const image = posterUrl(input.posterPath, 'w500') || backdropUrl(input.backdropPath, 'w1280');
  return {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: input.name,
    description: truncate(input.description, 300),
    url: absoluteUrl(`/tv/${input.id}`),
    image: image || undefined,
    datePublished: input.firstAirDate || undefined,
    aggregateRating:
      input.rating && input.rating > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: Number(input.rating.toFixed(1)),
            bestRating: 10,
            worstRating: 0,
          }
        : undefined,
  };
}
