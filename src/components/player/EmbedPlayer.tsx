'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertTriangle, Loader2, Maximize2, RefreshCw, SkipForward } from 'lucide-react';
import {
  STREAM_SERVERS,
  getServer,
  nextServerId,
  type StreamTarget,
} from '@/lib/stream-servers';
import { cn } from '@/lib/utils';

type Props = {
  target: StreamTarget;
  title: string;
  initialServerId?: string;
};

export function EmbedPlayer({ target, title, initialServerId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const serverId = searchParams.get('server') || initialServerId || STREAM_SERVERS[0].id;
  const server = getServer(serverId);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const embedUrl = useMemo(
    () => server.buildUrl(target, { lang: 'en' }),
    [server, target]
  );

  useEffect(() => {
    setLoading(true);
    const t = window.setTimeout(() => setLoading(false), 8000);
    return () => window.clearTimeout(t);
  }, [embedUrl, reloadKey]);

  const selectServer = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('server', id);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const tryNextServer = useCallback(() => {
    selectServer(nextServerId(server.id));
  }, [selectServer, server.id]);

  return (
    <div className="space-y-4">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black ring-1 ring-border shadow-2xl">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-surface">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="text-sm text-muted">Loading {server.label}…</p>
          </div>
        )}
        <iframe
          key={`${embedUrl}-${reloadKey}`}
          src={embedUrl}
          title={title}
          className="absolute inset-0 h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          referrerPolicy="no-referrer"
          onLoad={() => setLoading(false)}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Servers · try another if playback fails
          </p>
          <div className="flex flex-wrap gap-2">
            {STREAM_SERVERS.map((s) => {
              const active = s.id === server.id;
              return (
                <motion.button
                  key={s.id}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => selectServer(s.id)}
                  className={cn(
                    'rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide transition',
                    active
                      ? 'bg-accent text-background'
                      : 'border border-border bg-surface text-muted hover:border-accent/40 hover:text-foreground'
                  )}
                >
                  {s.label}
                  {s.softSubs ? ' · SUBS' : ''}
                  {s.multiAudio ? ' · AUDIO' : ''}
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={tryNextServer}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-accent px-3 text-xs font-semibold text-background transition hover:brightness-110"
          >
            <SkipForward className="h-3.5 w-3.5" />
            Next server
          </button>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-medium text-muted transition hover:text-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reload
          </button>
          <a
            href={embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-medium text-muted transition hover:text-foreground"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            Open player
          </a>
        </div>
      </div>

      <p className="flex items-start gap-2 text-xs text-muted">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
        Prefer SUBS · AUDIO sources. Switch server if one fails.
      </p>
    </div>
  );
}
