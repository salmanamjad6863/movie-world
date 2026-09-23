import Link from 'next/link';
import { SITE_NAME } from '@/constants/site';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-surface/40">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <p className="font-display text-xl tracking-wide text-foreground">
            <span className="text-accent">MOVIE</span> WORLD
          </p>
          <p className="mt-1 max-w-md text-sm text-muted">
            Browse movies and TV seasons. Catalog powered by TMDB.
          </p>
        </div>
        <div className="space-y-2 text-sm text-muted">
          <p>
            This product uses the TMDB API but is not endorsed or certified by{' '}
            <Link
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              TMDB
            </Link>
            .
          </p>
          <p className="text-xs text-muted/70">© {new Date().getFullYear()} {SITE_NAME}</p>
        </div>
      </div>
    </footer>
  );
}
