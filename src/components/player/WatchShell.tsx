import Link from 'next/link';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { SmoothPlayer } from '@/components/player/SmoothPlayer';
import type { LangOption, StreamTarget } from '@/lib/stream-servers';

type NavLink = { href: string; label: string } | null;

type Props = {
  target: StreamTarget;
  title: string;
  subtitle?: string;
  backHref: string;
  backLabel: string;
  initialServerId?: string;
  audioLanguages?: LangOption[];
  imdbId?: string | null;
  prev?: NavLink;
  next?: NavLink;
  sidebar?: React.ReactNode;
};

export function WatchShell({
  target,
  title,
  subtitle,
  backHref,
  backLabel,
  audioLanguages,
  imdbId,
  prev,
  next,
  sidebar,
}: Props) {
  return (
    <main className="flex w-full flex-1 flex-col bg-background">
      <div className="border-b border-border/60 bg-background/90">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <Link
              href={backHref}
              className="inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-accent"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {backLabel}
            </Link>
            <h1 className="mt-1 truncate font-display text-2xl tracking-wide text-foreground sm:text-3xl">
              {title}
            </h1>
            {subtitle && <p className="truncate text-xs text-muted sm:text-sm">{subtitle}</p>}
          </div>

          {(prev || next) && (
            <div className="flex shrink-0 gap-2">
              {prev ? (
                <Link
                  href={prev.href}
                  className="inline-flex h-9 items-center gap-1 rounded-full border border-border bg-surface px-3 text-xs text-muted transition hover:text-foreground"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {prev.label}
                </Link>
              ) : null}
              {next ? (
                <Link
                  href={next.href}
                  className="inline-flex h-9 items-center gap-1 rounded-full border border-border bg-surface px-3 text-xs text-muted transition hover:text-foreground"
                >
                  {next.label}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[1400px] flex-1 gap-6 px-4 py-5 sm:gap-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:px-8">
        <div className="min-w-0">
          <SmoothPlayer
            target={target}
            title={title}
            audioLanguages={audioLanguages}
            imdbId={imdbId}
          />
        </div>
        {sidebar ? <div className="min-w-0">{sidebar}</div> : null}
      </div>
    </main>
  );
}
