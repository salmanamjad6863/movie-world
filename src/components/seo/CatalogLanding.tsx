import Link from 'next/link';
import { MediaGrid } from '@/components/media/MediaGrid';
import { MediaRow } from '@/components/media/MediaRow';
import { JsonLd } from '@/components/seo/JsonLd';
import type { SeoHubConfig } from '@/constants/seo';
import { SEO_HUBS } from '@/constants/seo';
import { absoluteUrl } from '@/constants/site';
import { collectionPageJsonLd } from '@/lib/seo';
import type { MediaType, TmdbMediaListItem } from '@/types/tmdb';

type Props = {
  hub: SeoHubConfig;
  primary: TmdbMediaListItem[];
  secondary?: TmdbMediaListItem[];
  secondaryTitle?: string;
  forceType?: MediaType;
};

export function CatalogLanding({
  hub,
  primary,
  secondary,
  secondaryTitle,
  forceType,
}: Props) {
  const related = SEO_HUBS.filter((h) => h.slug !== hub.slug).slice(0, 4);
  const itemUrls = primary.map((item) => {
    const type = forceType || (item.media_type === 'tv' ? 'tv' : 'movie');
    return absoluteUrl(`/${type}/${item.id}`);
  });

  return (
    <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <JsonLd
        data={collectionPageJsonLd({
          name: hub.heading,
          description: hub.description,
          path: hub.path,
          itemUrls,
        })}
      />
      <header className="max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Browse</p>
        <h1 className="mt-2 font-display text-4xl tracking-wide text-foreground sm:text-5xl">
          {hub.heading}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted sm:text-lg">{hub.description}</p>
      </header>

      <section className="mt-10" aria-labelledby="catalog-primary">
        <h2 id="catalog-primary" className="font-display text-2xl tracking-wide text-foreground">
          Featured titles
        </h2>
        <div className="mt-6">
          <MediaGrid items={primary} forceType={forceType} emptyMessage="No titles loaded yet." />
        </div>
      </section>

      {secondary && secondary.length > 0 && secondaryTitle ? (
        <div className="mt-14">
          <MediaRow title={secondaryTitle} items={secondary} forceType={forceType} />
        </div>
      ) : null}

      <nav className="mt-16 border-t border-border pt-8" aria-label="Related catalogs">
        <h2 className="font-display text-xl tracking-wide text-foreground">More to explore</h2>
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {related.map((item) => (
            <li key={item.slug}>
              <Link href={item.path} className="text-accent hover:underline">
                {item.heading}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/search" className="text-muted hover:text-foreground hover:underline">
              Search all titles
            </Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}
