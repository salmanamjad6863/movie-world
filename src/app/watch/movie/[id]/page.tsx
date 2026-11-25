import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MediaRow } from '@/components/media/MediaRow';
import { WatchShell } from '@/components/player/WatchShell';
import { TmdbMissingKey } from '@/components/ui/TmdbMissingKey';
import { getMovie, getMovieSuggested, isTmdbConfigured, TmdbConfigError } from '@/lib/tmdb';
import { buildMediaMetadata } from '@/lib/seo';
import { audioLangsFromTmdb } from '@/lib/stream-servers';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ server?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!isTmdbConfigured()) return { title: 'Watch', robots: { index: false, follow: true } };
  try {
    const { id } = await params;
    const movie = await getMovie(id);
    return buildMediaMetadata({
      title: `Watch ${movie.title}`,
      description: movie.overview,
      path: `/watch/movie/${id}`,
      type: 'movie',
      backdropPath: movie.backdrop_path,
      posterPath: movie.poster_path,
      noIndex: true,
    });
  } catch {
    return { title: 'Watch', robots: { index: false, follow: true } };
  }
}

export default async function WatchMoviePage({ params, searchParams }: Props) {
  if (!isTmdbConfigured()) {
    return (
      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-4 py-10">
        <TmdbMissingKey />
      </main>
    );
  }

  const { id } = await params;
  const sp = await searchParams;

  let movie;
  try {
    movie = await getMovie(id);
  } catch (err) {
    if (err instanceof TmdbConfigError) {
      return (
        <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-4 py-10">
          <TmdbMissingKey />
        </main>
      );
    }
    notFound();
  }

  const recommended = await getMovieSuggested(id, 18);
  const year = movie.release_date?.slice(0, 4);
  const audioLanguages = audioLangsFromTmdb(movie);
  const imdbId = movie.imdb_id || null;

  return (
    <WatchShell
      target={{ type: 'movie', tmdbId: id }}
      title={movie.title}
      subtitle={[year, movie.runtime ? `${movie.runtime} min` : null].filter(Boolean).join(' · ')}
      backHref={`/movie/${id}`}
      backLabel="Back to details"
      initialServerId={sp.server}
      audioLanguages={audioLanguages}
      imdbId={imdbId}
      sidebar={
        <aside className="space-y-4 bg-surface/30 p-5 lg:sticky lg:top-0 lg:max-h-screen lg:overflow-y-auto">
          <h2 className="font-display text-xl tracking-wide text-foreground">ABOUT</h2>
          <p className="text-sm leading-relaxed text-muted line-clamp-10">
            {movie.overview || 'No overview available.'}
          </p>
          <Link
            href={`/movie/${id}`}
            className="inline-flex text-sm font-medium text-accent hover:brightness-110"
          >
            Full details →
          </Link>
        </aside>
      }
      below={
        recommended.length ? (
          <div className="mx-auto w-full max-w-[1400px]">
            <MediaRow title="Recommended Movies" items={recommended} forceType="movie" />
          </div>
        ) : null
      }
    />
  );
}
