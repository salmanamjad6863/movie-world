'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaCard } from './MediaCard';
import { FadeInView } from '@/components/motion/FadeIn';
import type { MediaType, TmdbMediaListItem } from '@/types/tmdb';
import { cn } from '@/lib/utils';

type Props = {
  title: string;
  items: TmdbMediaListItem[];
  forceType?: MediaType;
};

export function MediaRow({ title, items, forceType }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [maxOffset, setMaxOffset] = useState(0);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const measure = () => {
      const nextMax = Math.max(0, track.scrollWidth - viewport.clientWidth);
      setMaxOffset(nextMax);
      setOffset((cur) => Math.min(cur, nextMax));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(viewport);
    ro.observe(track);
    return () => ro.disconnect();
  }, [items.length]);

  function scroll(dir: -1 | 1) {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const step = Math.min(viewport.clientWidth * 0.85, 720);
    setOffset((cur) => Math.min(maxOffset, Math.max(0, cur + dir * step)));
  }

  if (!items.length) return null;

  const canPrev = offset > 0;
  const canNext = offset < maxOffset - 1;

  return (
    <FadeInView className="space-y-4">
      <div className="flex items-end justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl tracking-wide text-foreground sm:text-3xl">{title}</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Scroll left"
            disabled={!canPrev}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-muted transition hover:border-accent/40 hover:text-foreground disabled:pointer-events-none',
              !canPrev && 'opacity-35'
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Scroll right"
            disabled={!canNext}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-muted transition hover:border-accent/40 hover:text-foreground disabled:pointer-events-none',
              !canNext && 'opacity-35'
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* No overflow scrollport — page wheel/trackpad always scrolls the screen */}
      <div ref={viewportRef} className="overflow-x-clip px-4 sm:px-6 lg:px-8">
        <div
          ref={trackRef}
          className="flex gap-3 transition-transform duration-300 ease-out sm:gap-4"
          style={{ transform: `translate3d(-${offset}px, 0, 0)` }}
        >
          {items.map((item, i) => (
            <MediaCard
              key={`${forceType ?? item.media_type}-${item.id}`}
              item={item}
              forceType={forceType}
              index={i}
            />
          ))}
        </div>
      </div>
    </FadeInView>
  );
}
