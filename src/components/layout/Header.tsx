'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Search, Clapperboard } from 'lucide-react';
import { motion } from 'framer-motion';
import { Suspense } from 'react';
import { SITE_NAME } from '@/constants/site';
import { cn } from '@/lib/utils';

function NavLinks() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const type = searchParams.get('type');

  const items = [
    { href: '/', label: 'Home', active: pathname === '/' },
    {
      href: '/search?type=movie',
      label: 'Movies',
      active: pathname.startsWith('/movie') || (pathname.startsWith('/search') && type === 'movie'),
    },
    {
      href: '/search?type=tv',
      label: 'Series',
      active: pathname.startsWith('/tv') || (pathname.startsWith('/search') && type === 'tv'),
    },
  ];

  return (
    <nav className="hidden items-center gap-1 md:flex">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            item.active ? 'text-accent' : 'text-muted hover:text-foreground'
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function Header() {
  const brand = SITE_NAME.split(/\s+/);
  const first = brand[0] ?? 'Movie';
  const rest = brand.slice(1).join(' ') || 'World';

  return (
    <motion.header
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-8">
          <Link href="/" className="group flex shrink-0 items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-background transition duration-300 group-hover:scale-105">
              <Clapperboard className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <span className="font-display text-2xl leading-none tracking-wide">
              <span className="text-accent">{first.toUpperCase()}</span>
              <span className="text-foreground"> {rest.toUpperCase()}</span>
            </span>
          </Link>

          <Suspense fallback={null}>
            <NavLinks />
          </Suspense>
        </div>

        <Link
          href="/search"
          className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm text-muted transition hover:border-accent/40 hover:text-foreground"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search titles…</span>
        </Link>
      </div>
    </motion.header>
  );
}
