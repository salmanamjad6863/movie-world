'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Play, Info, Star } from 'lucide-react';
import { backdropUrl, mediaTitle, mediaYear, resolveMediaType } from '@/lib/tmdb';
import type { MediaType, TmdbMediaListItem } from '@/types/tmdb';
import { SITE_NAME } from '@/constants/site';

type Props = {
  item: TmdbMediaListItem;
  forceType?: MediaType;
};

export function HeroBanner({ item, forceType }: Props) {
  const type = forceType ?? resolveMediaType(item);
  const title = mediaTitle(item);
  const year = mediaYear(item);
  const detailsHref = type === 'tv' ? `/tv/${item.id}` : `/movie/${item.id}`;
  const watchHref = type === 'tv' ? `/watch/tv/${item.id}/1/1` : `/watch/movie/${item.id}`;
  const backdrop = backdropUrl(item.backdrop_path, 'original') || backdropUrl(item.poster_path, 'original');
  const rating =
    typeof item.vote_average === 'number' && item.vote_average > 0
      ? item.vote_average.toFixed(1)
      : null;

  return (
    <section className="relative isolate min-h-[58vh] w-full overflow-hidden sm:min-h-[74vh]">
      {backdrop && (
        <motion.div
          initial={{ scale: 1.08, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <Image
            src={backdrop}
            alt=""
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
        </motion.div>
      )}

      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(232,163,23,0.12),transparent_55%)]" />

      <div className="relative mx-auto flex min-h-[58vh] max-w-[1400px] flex-col justify-end px-4 pb-10 pt-20 sm:min-h-[74vh] sm:px-6 sm:pb-14 sm:pt-24 lg:px-8">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="font-display text-4xl tracking-wide text-accent sm:text-6xl md:text-7xl lg:text-8xl"
        >
          {SITE_NAME.toUpperCase()}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 max-w-2xl sm:mt-6"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent/90">
            Featured {type}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            {title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted sm:mt-3">
            {year && <span>{year}</span>}
            {rating && (
              <span className="inline-flex items-center gap-1 text-accent">
                <Star className="h-3.5 w-3.5 fill-accent" />
                {rating}
              </span>
            )}
          </div>
          {item.overview && (
            <p className="mt-4 hidden line-clamp-3 text-sm leading-relaxed text-muted sm:block sm:text-base">
              {item.overview}
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-3 sm:mt-7">
            <Link
              href={watchHref}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-background transition hover:brightness-110 sm:h-12 sm:px-6"
            >
              <Play className="h-4 w-4 fill-current" />
              Play now
            </Link>
            <Link
              href={detailsHref}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-surface/60 px-5 text-sm font-medium text-foreground backdrop-blur transition hover:border-accent/40 sm:h-12 sm:px-6"
            >
              <Info className="h-4 w-4" />
              Details
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
