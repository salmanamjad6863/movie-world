'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { mediaTitle, mediaYear, posterUrl, resolveMediaType } from '@/lib/tmdb';
import type { MediaType, TmdbMediaListItem } from '@/types/tmdb';
import { cn } from '@/lib/utils';

type Props = {
  item: TmdbMediaListItem;
  forceType?: MediaType;
  index?: number;
  className?: string;
};

export function MediaCard({ item, forceType, index = 0, className }: Props) {
  const type = forceType ?? resolveMediaType(item);
  const title = mediaTitle(item);
  const year = mediaYear(item);
  const poster = posterUrl(item.poster_path, 'w342');
  const href = type === 'tv' ? `/tv/${item.id}` : `/movie/${item.id}`;
  const rating =
    typeof item.vote_average === 'number' && item.vote_average > 0
      ? item.vote_average.toFixed(1)
      : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.28), ease: [0.22, 1, 0.36, 1] }}
      className={cn('w-[140px] shrink-0 sm:w-[160px] md:w-[180px]', className)}
    >
      <Link href={href} className="group block">
        <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-surface-2 ring-1 ring-border transition duration-300 group-hover:ring-accent/50 group-hover:shadow-[0_12px_40px_-12px_rgba(232,163,23,0.35)]">
          {poster ? (
            <Image
              src={poster}
              alt={title}
              fill
              sizes="180px"
              className="object-cover transition duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-2 text-center text-xs text-muted">
              No poster
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
          {rating && (
            <span className="absolute top-2 right-2 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-semibold text-accent backdrop-blur-sm">
              ★ {rating}
            </span>
          )}
          <span className="absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-200">
            {type}
          </span>
        </div>
        <div className="mt-2.5 min-w-0">
          <p className="truncate text-sm font-medium text-foreground transition group-hover:text-accent">
            {title}
          </p>
          {year && <p className="text-xs text-muted">{year}</p>}
        </div>
      </Link>
    </motion.div>
  );
}
