import { Suspense } from 'react';
import type { Metadata } from 'next';
import { MediaGrid } from '@/components/media/MediaGrid';
import { SearchForm } from '@/components/search/SearchForm';
import { TmdbMissingKey } from '@/components/ui/TmdbMissingKey';
import { SITE_NAME, absoluteUrl } from '@/constants/site';
import {
  getPopularMovies,
  getPopularTv,
  isTmdbConfigured,
  searchMovies,
  searchMulti,
  searchTv,
  TmdbConfigError,
} from '@/lib/tmdb';
import type { MediaType, TmdbMediaListItem } from '@/types/tmdb';

type SearchParams = Promise<{ q?: string; type?: string }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  const q = (params.q || '').trim();
  const type = params.type === 'movie' ? 'Movies' : params.type === 'tv' ? 'Series' : 'Movies & Series';
  const title = q ? `Search “${q}”` : `Search ${type}`;
  const description = q
    ? `Results for “${q}” on ${SITE_NAME} — browse matching ${type.toLowerCase()}.`
    : `Search ${type.toLowerCase()} across trending titles, popular films, and TV seasons.`;

  return {
    title,
    description,
    alternates: {
      canonical: absoluteUrl(
        q
          ? `/search?q=${encodeURIComponent(q)}${params.type ? `&type=${params.type}` : ''}`
          : params.type
            ? `/search?type=${params.type}`
            : '/search'
      ),
    },
    robots: q ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: absoluteUrl('/search'),
      type: 'website',
    },
  };
}

async function runSearch(q: string, type: string): Promise<TmdbMediaListItem[]> {
  if (type === 'movie') {
    const data = await searchMovies(q);
    return data.results.map((r) => ({ ...r, media_type: 'movie' }));
  }
  if (type === 'tv') {
    const data = await searchTv(q);
    return data.results.map((r) => ({ ...r, media_type: 'tv' }));
  }
  const data = await searchMulti(q);
  return data.results.filter(
    (r) => r.media_type === 'movie' || r.media_type === 'tv'
  ) as TmdbMediaListItem[];
}

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = (params.q || '').trim();
  const type = (params.type || 'multi') as string;

  if (!isTmdbConfigured()) {
    return (
      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
        <TmdbMissingKey />
      </main>
    );
  }

  let items: TmdbMediaListItem[] = [];
  let error: string | null = null;
  let browseLabel = '';

  try {
    if (q) {
      items = await runSearch(q, type);
    } else if (type === 'movie') {
      items = (await getPopularMovies()).results;
      browseLabel = 'Popular movies';
    } else if (type === 'tv') {
      items = (await getPopularTv()).results;
      browseLabel = 'Popular series';
    }
  } catch (err) {
    if (err instanceof TmdbConfigError) {
      return (
        <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
          <TmdbMissingKey />
        </main>
      );
    }
    error = err instanceof Error ? err.message : 'Search failed';
  }

  const forceType: MediaType | undefined =
    type === 'movie' || type === 'tv' ? type : undefined;

  return (
    <main className="mx-auto w-full max-w-[1400px] flex-1 space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <h1 className="font-display text-4xl tracking-wide text-foreground sm:text-5xl">SEARCH</h1>
        <p className="mt-2 text-sm text-muted">Find movies and TV seasons by title.</p>
      </div>

      <Suspense fallback={null}>
        <SearchForm initialQuery={q} initialType={type} />
      </Suspense>

      {error && (
        <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      {q ? (
        <div className="space-y-5">
          <h2 className="text-lg font-semibold text-foreground">
            Results for “{q}”
            <span className="ml-2 text-sm font-normal text-muted">({items.length})</span>
          </h2>
          <MediaGrid items={items} forceType={forceType} emptyMessage="No matches found." />
        </div>
      ) : browseLabel ? (
        <div className="space-y-5">
          <h2 className="font-display text-2xl tracking-wide text-foreground">{browseLabel}</h2>
          <MediaGrid items={items} forceType={forceType} />
        </div>
      ) : (
        <p className="py-12 text-center text-sm text-muted">Start typing to explore the catalog.</p>
      )}
    </main>
  );
}
