import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Star, Clock, ArrowLeft, Play } from 'lucide-react';
import { TmdbMissingKey } from '@/components/ui/TmdbMissingKey';
import { backdropUrl, getMovie, isTmdbConfigured, posterUrl, TmdbConfigError } from '@/lib/tmdb';
import { watchMoviePath } from '@/lib/stream-servers';
import type { Metadata } from 'next';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!isTmdbConfigured()) return { title: 'Movie' };
  try {
    const { id } = await params;
    const movie = await getMovie(id);
    return {
      title: movie.title,
      description: movie.overview?.slice(0, 160) || undefined,
    };
  } catch {
    return { title: 'Movie' };
  }
}

export default async function MoviePage({ params }: Props) {
  if (!isTmdbConfigured()) {
    return (
      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-4 py-10">
        <TmdbMissingKey />
      </main>
    );
  }

  const { id } = await params;
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

  const poster = posterUrl(movie.poster_path, 'w500');
  const backdrop = backdropUrl(movie.backdrop_path, 'original');
  const year = movie.release_date?.slice(0, 4);
  const runtime =
    movie.runtime && movie.runtime > 0
      ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
      : null;

  return (
    <main className="relative flex-1">
      {backdrop && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[55vh] overflow-hidden">
          <Image src={backdrop} alt="" fill priority className="object-cover opacity-40" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/70 to-background" />
        </div>
      )}

      <div className="relative mx-auto grid w-full max-w-[1400px] gap-8 px-4 py-10 sm:grid-cols-[220px_1fr] sm:px-6 lg:grid-cols-[260px_1fr] lg:gap-12 lg:px-8 lg:py-14">
        <div className="relative mx-auto aspect-[2/3] w-52 overflow-hidden rounded-xl bg-surface-2 shadow-2xl ring-1 ring-border sm:mx-0 sm:w-full">
          {poster ? (
            <Image src={poster} alt={movie.title} fill className="object-cover" sizes="260px" priority />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted">No poster</div>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Movie</p>
            <h1 className="mt-2 font-display text-4xl tracking-wide text-foreground sm:text-5xl md:text-6xl">
              {movie.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
              {year && <span>{year}</span>}
              {runtime && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {runtime}
                </span>
              )}
              {movie.vote_average > 0 && (
                <span className="inline-flex items-center gap-1 text-accent">
                  <Star className="h-3.5 w-3.5 fill-accent" />
                  {movie.vote_average.toFixed(1)}
                </span>
              )}
              {movie.status && <span>{movie.status}</span>}
            </div>
          </div>

          {movie.genres?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {movie.genres.map((g) => (
                <span
                  key={g.id}
                  className="rounded-full border border-border bg-surface/60 px-3 py-1 text-xs text-muted"
                >
                  {g.name}
                </span>
              ))}
            </div>
          )}

          {movie.tagline && <p className="text-sm italic text-muted">{movie.tagline}</p>}

          <p className="max-w-2xl text-sm leading-relaxed text-foreground/85 sm:text-base">
            {movie.overview || 'No overview available.'}
          </p>

          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href={watchMoviePath(movie.id)}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-background transition hover:brightness-110"
            >
              <Play className="h-4 w-4 fill-current" />
              Play movie
            </Link>
            <Link
              href="/search?type=movie"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-border bg-surface px-5 text-sm text-muted transition hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to movies
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
