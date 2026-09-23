'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

type Props = {
  initialQuery?: string;
  initialType?: string;
};

export function SearchForm({ initialQuery = '', initialType = 'multi' }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState(initialType || searchParams.get('type') || 'multi');

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (type && type !== 'multi') params.set('type', type);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onSubmit={onSubmit}
      className="flex w-full flex-col gap-3 sm:flex-row"
    >
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search movies & TV shows…"
          autoFocus
          className="h-12 w-full rounded-full border border-border bg-surface pl-11 pr-4 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="h-12 rounded-full border border-border bg-surface px-4 text-sm text-foreground focus:border-accent focus:outline-none"
      >
        <option value="multi">All</option>
        <option value="movie">Movies</option>
        <option value="tv">TV</option>
      </select>
      <button
        type="submit"
        className="h-12 rounded-full bg-accent px-7 text-sm font-semibold text-background transition hover:brightness-110"
      >
        Search
      </button>
    </motion.form>
  );
}
