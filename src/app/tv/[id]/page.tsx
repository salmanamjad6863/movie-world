import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Star, ArrowLeft, Play } from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';
import { TmdbMissingKey } from '@/components/ui/TmdbMissingKey';
import {
  backdropUrl,
  getTv,
  getTvSeason,
  isTmdbConfigured,
  posterUrl,
  TmdbConfigError,
} from '@/lib/tmdb';
import { buildMediaMetadata, tvSeriesJsonLd } from '@/lib/seo';
import { watchTvPath } from '@/lib/stream-servers';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ season?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!isTmdbConfigured()) return { title: 'TV Show' };
  try {
    const { id } = await params;
    const show = await getTv(id);
    const year = show.first_air_date?.slice(0, 4);
    const genreNames = (show.genres || []).map((g) => g.name);
    return buildMediaMetadata({
      title: year ? `${show.name} (${year})` : show.name,
      description:
        show.overview ||
        `Watch ${show.name} free seasons online on Movie World. Browse episodes and related series.`,
      path: `/tv/${id}`,
      type: 'tv',
      backdropPath: show.backdrop_path,
      posterPath: show.poster_path,
      keywords: [
        show.name,
        ...(year ? [`${show.name} ${year}`] : []),
        ...genreNames,
        'free seasons',
        'free TV shows',
        'watch TV seasons online',
        'Movie World',
      ],
    });
  } catch {
    return { title: 'TV Show' };
  }
}

export default async function TvPage({ params, searchParams }: Props) {
  if (!isTmdbConfigured()) {
    return (
      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-4 py-10">
        <TmdbMissingKey />
      </main>
    );
  }

  const { id } = await params;
  const sp = await searchParams;

  let show;
  try {
    show = await getTv(id);
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

  const seasons = (show.seasons || []).filter((s) => s.season_number > 0);
  const requested = Number(sp.season);
  const activeSeason =
    seasons.find((s) => s.season_number === requested)?.season_number ??
    seasons[0]?.season_number ??
    1;

  let seasonDetails = null;
  try {
    seasonDetails = await getTvSeason(id, activeSeason);
  } catch {
    seasonDetails = null;
  }

  const poster = posterUrl(show.poster_path, 'w500');
  const backdrop = backdropUrl(show.backdrop_path, 'original');
  const year = show.first_air_date?.slice(0, 4);

  return (
    <main className="relative flex-1">
      <JsonLd
        data={tvSeriesJsonLd({
          id: show.id,
          name: show.name,
          description: show.overview,
          posterPath: show.poster_path,
          backdropPath: show.backdrop_path,
          firstAirDate: show.first_air_date,
          rating: show.vote_average,
        })}
      />
      {backdrop && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[55vh] overflow-hidden">
          <Image src={backdrop} alt="" fill priority className="object-cover opacity-40" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/70 to-background" />
        </div>
      )}

      <div className="relative mx-auto w-full max-w-[1400px] space-y-12 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-8 sm:grid-cols-[220px_1fr] lg:grid-cols-[260px_1fr] lg:gap-12">
          <div className="relative mx-auto aspect-[2/3] w-52 overflow-hidden rounded-xl bg-surface-2 shadow-2xl ring-1 ring-border sm:mx-0 sm:w-full">
            {poster ? (
              <Image src={poster} alt={show.name} fill className="object-cover" sizes="260px" priority />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted">No poster</div>
            )}
          </div>

          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">TV Series</p>
              <h1 className="mt-2 font-display text-4xl tracking-wide text-foreground sm:text-5xl md:text-6xl">
                {show.name}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
                {year && <span>{year}</span>}
                <span>
                  {show.number_of_seasons} season{show.number_of_seasons === 1 ? '' : 's'}
                </span>
                <span>{show.number_of_episodes} episodes</span>
                {show.vote_average > 0 && (
                  <span className="inline-flex items-center gap-1 text-accent">
                    <Star className="h-3.5 w-3.5 fill-accent" />
                    {show.vote_average.toFixed(1)}
                  </span>
                )}
                {show.status && <span>{show.status}</span>}
              </div>
            </div>

            {show.genres?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {show.genres.map((g) => (
                  <span
                    key={g.id}
                    className="rounded-full border border-border bg-surface/60 px-3 py-1 text-xs text-muted"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            <p className="max-w-2xl text-sm leading-relaxed text-foreground/85 sm:text-base">
              {show.overview || 'No overview available.'}
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                href={watchTvPath(show.id, activeSeason, 1)}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-background transition hover:brightness-110"
              >
                <Play className="h-4 w-4 fill-current" />
                Play S{activeSeason}E1
              </Link>
              <Link
                href="/search?type=tv"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-border bg-surface px-5 text-sm text-muted transition hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to series
              </Link>
            </div>
          </div>
        </div>

        {seasons.length > 0 && (
          <section className="space-y-5">
            <h2 className="font-display text-3xl tracking-wide text-foreground">SEASONS</h2>
            <div className="flex flex-wrap gap-2">
              {seasons.map((s) => {
                const active = s.season_number === activeSeason;
                return (
                  <Link
                    key={s.id}
                    href={`/tv/${id}?season=${s.season_number}`}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      active
                        ? 'bg-accent text-background'
                        : 'border border-border text-muted hover:border-accent/40 hover:text-foreground'
                    }`}
                  >
                    S{s.season_number}
                    <span className="ml-1.5 text-xs opacity-70">({s.episode_count})</span>
                  </Link>
                );
              })}
            </div>

            {seasonDetails && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  {seasonDetails.name}
                  {seasonDetails.air_date && (
                    <span className="ml-2 text-sm font-normal text-muted">
                      {seasonDetails.air_date.slice(0, 4)}
                    </span>
                  )}
                </h3>
                <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface/30">
                  {seasonDetails.episodes.map((ep) => {
                    const still = posterUrl(ep.still_path, 'w185');
                    return (
                      <li key={ep.id}>
                        <Link
                          href={watchTvPath(id, activeSeason, ep.episode_number)}
                          className="flex gap-3 p-3 transition hover:bg-surface-2/50 sm:gap-4 sm:p-4"
                        >
                          <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-surface-2 sm:h-20 sm:w-36">
                            {still ? (
                              <Image src={still} alt="" fill className="object-cover" sizes="144px" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[10px] text-muted">
                                No still
                              </div>
                            )}
                            <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition hover:bg-black/35 hover:opacity-100">
                              <Play className="h-6 w-6 fill-accent text-accent" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground">
                              <span className="text-accent">E{ep.episode_number}</span>
                              <span className="mx-1.5 text-muted">·</span>
                              {ep.name}
                            </p>
                            <p className="mt-1 line-clamp-2 text-xs text-muted sm:text-sm">
                              {ep.overview || 'No description.'}
                            </p>
                            <p className="mt-1 text-[11px] text-muted/70">
                              {ep.air_date || 'TBA'}
                              {ep.runtime ? ` · ${ep.runtime}m` : ''}
                              <span className="ml-2 text-accent">Play →</span>
                            </p>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </section>
        )}

      </div>
    </main>
  );
}
