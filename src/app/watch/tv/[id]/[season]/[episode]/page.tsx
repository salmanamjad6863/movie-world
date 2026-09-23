import Link from 'next/link';
import { notFound } from 'next/navigation';
import { WatchShell } from '@/components/player/WatchShell';
import { TmdbMissingKey } from '@/components/ui/TmdbMissingKey';
import { getTv, getTvEpisodeExternalIds, getTvExternalIds, getTvSeason, isTmdbConfigured, TmdbConfigError } from '@/lib/tmdb';
import { audioLangsFromTmdb, watchTvPath } from '@/lib/stream-servers';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ id: string; season: string; episode: string }>;
  searchParams: Promise<{ server?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!isTmdbConfigured()) return { title: 'Watch' };
  try {
    const { id, season, episode } = await params;
    const show = await getTv(id);
    return {
      title: `Watch ${show.name} S${season}E${episode}`,
    };
  } catch {
    return { title: 'Watch' };
  }
}

export default async function WatchTvEpisodePage({ params, searchParams }: Props) {
  if (!isTmdbConfigured()) {
    return (
      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-4 py-10">
        <TmdbMissingKey />
      </main>
    );
  }

  const { id, season: seasonStr, episode: episodeStr } = await params;
  const sp = await searchParams;
  const season = Number(seasonStr);
  const episode = Number(episodeStr);

  if (!Number.isFinite(season) || !Number.isFinite(episode) || season < 1 || episode < 1) {
    notFound();
  }

  let show;
  let seasonDetails;
  let imdbId: string | null = null;
  try {
    const [showRes, seasonRes, epExt, showExt] = await Promise.all([
      getTv(id),
      getTvSeason(id, season),
      getTvEpisodeExternalIds(id, season, episode).catch(() => null),
      getTvExternalIds(id).catch(() => null),
    ]);
    show = showRes;
    seasonDetails = seasonRes;
    imdbId = epExt?.imdb_id || showExt?.imdb_id || null;
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

  const episodes = seasonDetails.episodes || [];
  const current = episodes.find((e) => e.episode_number === episode);
  const currentIndex = episodes.findIndex((e) => e.episode_number === episode);
  const prevEp = currentIndex > 0 ? episodes[currentIndex - 1] : null;
  const nextEp =
    currentIndex >= 0 && currentIndex < episodes.length - 1 ? episodes[currentIndex + 1] : null;

  const seasons = (show.seasons || []).filter((s) => s.season_number > 0);
  const serverQ = sp.server ? `?server=${sp.server}` : '';
  const audioLanguages = audioLangsFromTmdb(show);

  return (
    <WatchShell
      target={{ type: 'tv', tmdbId: id, season, episode }}
      title={show.name}
      subtitle={`S${season}E${episode}${current?.name ? ` · ${current.name}` : ''}`}
      backHref={`/tv/${id}?season=${season}`}
      backLabel="Back to series"
      initialServerId={sp.server}
      audioLanguages={audioLanguages}
      imdbId={imdbId}
      prev={
        prevEp
          ? {
              href: watchTvPath(id, season, prevEp.episode_number) + (sp.server ? `?server=${sp.server}` : ''),
              label: `E${prevEp.episode_number}`,
            }
          : null
      }
      next={
        nextEp
          ? {
              href: watchTvPath(id, season, nextEp.episode_number) + (sp.server ? `?server=${sp.server}` : ''),
              label: `E${nextEp.episode_number}`,
            }
          : null
      }
      sidebar={
        <aside className="flex max-h-[70vh] flex-col overflow-hidden rounded-xl border border-border bg-surface/40 lg:max-h-[calc(100vh-10rem)] lg:sticky lg:top-24">
          <div className="border-b border-border p-4">
            <h2 className="font-display text-xl tracking-wide text-foreground">EPISODES</h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {seasons.map((s) => (
                <Link
                  key={s.id}
                  href={`/watch/tv/${id}/${s.season_number}/1${serverQ}`}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[11px] font-medium transition',
                    s.season_number === season
                      ? 'bg-accent text-background'
                      : 'border border-border text-muted hover:text-foreground'
                  )}
                >
                  S{s.season_number}
                </Link>
              ))}
            </div>
          </div>
          <ul className="flex-1 overflow-y-auto p-2">
            {episodes.map((ep) => {
              const active = ep.episode_number === episode;
              return (
                <li key={ep.id}>
                  <Link
                    href={watchTvPath(id, season, ep.episode_number) + (sp.server ? `?server=${sp.server}` : '')}
                    className={cn(
                      'block rounded-lg px-3 py-2.5 transition',
                      active ? 'bg-accent/15 text-accent' : 'text-muted hover:bg-surface-2 hover:text-foreground'
                    )}
                  >
                    <p className="text-sm font-medium">
                      <span className={active ? 'text-accent' : 'text-muted'}>E{ep.episode_number}</span>
                      <span className="mx-1.5 opacity-40">·</span>
                      <span className="text-foreground">{ep.name}</span>
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </aside>
      }
    />
  );
}
