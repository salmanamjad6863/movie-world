import type { Metadata } from 'next';
import { CatalogLanding } from '@/components/seo/CatalogLanding';
import { TmdbMissingKey } from '@/components/ui/TmdbMissingKey';
import { getSeoHub } from '@/constants/seo';
import { buildHubMetadata, loadHubCatalog } from '@/lib/seo-hubs';
import { TmdbConfigError } from '@/lib/tmdb';

export const revalidate = 3600;

const SLUG = 'movies' as const;

export const metadata: Metadata = buildHubMetadata(SLUG);

export default async function MoviesPage() {
  const hub = getSeoHub(SLUG);

  try {
    const data = await loadHubCatalog(SLUG);
    if (!data.configured) {
      return (
        <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-4 py-10">
          <TmdbMissingKey />
        </main>
      );
    }

    return (
      <CatalogLanding
        hub={hub}
        primary={data.primary}
        secondary={data.secondary}
        secondaryTitle={data.secondaryTitle}
        forceType={data.forceType}
      />
    );
  } catch (err) {
    if (err instanceof TmdbConfigError) {
      return (
        <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-4 py-10">
          <TmdbMissingKey />
        </main>
      );
    }
    throw err;
  }
}
