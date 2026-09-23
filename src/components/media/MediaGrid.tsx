import { MediaCard } from './MediaCard';
import type { MediaType, TmdbMediaListItem } from '@/types/tmdb';

type Props = {
  items: TmdbMediaListItem[];
  forceType?: MediaType;
  emptyMessage?: string;
};

export function MediaGrid({ items, forceType, emptyMessage = 'Nothing here yet.' }: Props) {
  if (!items.length) {
    return <p className="py-16 text-center text-sm text-muted">{emptyMessage}</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 sm:gap-x-4 sm:gap-y-8">
      {items.map((item, i) => (
        <MediaCard
          key={`${forceType ?? item.media_type ?? 'm'}-${item.id}`}
          item={item}
          forceType={forceType}
          index={i}
          className="!w-full"
        />
      ))}
    </div>
  );
}
