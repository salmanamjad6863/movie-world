'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaCard } from './MediaCard';
import { FadeInView } from '@/components/motion/FadeIn';
import type { MediaType, TmdbMediaListItem } from '@/types/tmdb';

type Props = {
  title: string;
  items: TmdbMediaListItem[];
  forceType?: MediaType;
};

export function MediaRow({ title, items, forceType }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scroll(dir: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.85, 720), behavior: 'smooth' });
  }

  if (!items.length) return null;

  return (
    <FadeInView className="space-y-4">
      <div className="flex items-end justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl tracking-wide text-foreground sm:text-3xl">{title}</h2>
        <div className="hidden gap-2 sm:flex">
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Scroll left"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-muted transition hover:border-accent/40 hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Scroll right"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-muted transition hover:border-accent/40 hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="media-row-scroll flex gap-3 overflow-x-auto px-4 pb-2 scroll-smooth sm:gap-4 sm:px-6 lg:px-8"
      >
        {items.map((item, i) => (
          <MediaCard key={`${forceType ?? item.media_type}-${item.id}`} item={item} forceType={forceType} index={i} />
        ))}
      </div>
    </FadeInView>
  );
}
