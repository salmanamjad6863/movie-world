import Link from 'next/link';

export function TmdbMissingKey() {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-accent/30 bg-accent-soft px-6 py-8 text-center">
      <h2 className="font-display text-2xl tracking-wide text-accent">TMDB KEY REQUIRED</h2>
      <p className="mt-3 text-sm leading-relaxed text-foreground/80">
        Add your free key to <code className="rounded bg-black/30 px-1.5 py-0.5">.env.local</code> as{' '}
        <code className="rounded bg-black/30 px-1.5 py-0.5">TMDB_API_KEY</code>, then restart{' '}
        <code className="rounded bg-black/30 px-1.5 py-0.5">pnpm dev</code>.
      </p>
      <Link
        href="https://www.themoviedb.org/settings/api"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-flex text-sm font-medium text-accent underline underline-offset-4 hover:brightness-110"
      >
        Get a TMDB API key →
      </Link>
    </div>
  );
}
