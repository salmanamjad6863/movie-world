'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Captions,
  Languages,
  Loader2,
  Maximize,
  Minimize,
  RefreshCw,
  Scan,
  Settings2,
  Shield,
  Volume2,
  ZoomIn,
} from 'lucide-react';
import {
  STREAM_SERVERS,
  getServer,
  rankServerIds,
  type LangOption,
  type StreamTarget,
} from '@/lib/stream-servers';
import { cn } from '@/lib/utils';

type Props = {
  target: StreamTarget;
  title: string;
  audioLanguages?: LangOption[];
  imdbId?: string | null;
};

type WorkingServer = {
  id: string;
  label: string;
  softSubs?: boolean;
  multiAudio?: boolean;
  adRisk?: string;
};

type PickResponse = {
  preferred: { id: string; label: string; url: string } | null;
  working: WorkingServer[];
};

/** Fit = letterbox OK · Zoom = crop bars · Fill = crop more */
type ViewMode = 'fit' | 'zoom' | 'fill';

const VIEW_MODES: { id: ViewMode; label: string; scale: number }[] = [
  { id: 'fit', label: 'Fit', scale: 1 },
  { id: 'zoom', label: 'Zoom', scale: 1.2 },
  { id: 'fill', label: 'Fill', scale: 1.36 },
];

const COVER_AFTER_LOAD_MS = 1800;
const FAIL_OVER_MS = 9000;
const VIEW_STORAGE_KEY = 'mw-view-mode';

function targetQuery(target: StreamTarget, extra?: Record<string, string>): string {
  const parts =
    target.type === 'movie'
      ? [`type=movie`, `id=${encodeURIComponent(String(target.tmdbId))}`]
      : [
          `type=tv`,
          `id=${encodeURIComponent(String(target.tmdbId))}`,
          `season=${target.season}`,
          `episode=${target.episode}`,
        ];
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      parts.push(`${k}=${encodeURIComponent(v)}`);
    }
  }
  return parts.join('&');
}

function spokenParam(langs: LangOption[]): string {
  return langs.map((l) => `${l.code},${l.label}`).join('|');
}

function readStoredView(): ViewMode {
  if (typeof window === 'undefined') return 'zoom';
  const v = window.localStorage.getItem(VIEW_STORAGE_KEY);
  if (v === 'fit' || v === 'zoom' || v === 'fill') return v;
  return 'zoom';
}

export function SmoothPlayer({ target, title, audioLanguages, imdbId }: Props) {
  const shellRef = useRef<HTMLDivElement>(null);
  const initialAudio = useMemo(
    () => (audioLanguages?.length ? audioLanguages : []),
    [audioLanguages]
  );

  const [phase, setPhase] = useState<'buffering' | 'ready' | 'error'>('buffering');
  const [statusLine, setStatusLine] = useState('Starting playback...');
  const [progress, setProgress] = useState(15);
  const preferredIds = useMemo(
    () => rankServerIds(STREAM_SERVERS.filter((s) => s.adRisk !== 'high').map((s) => s.id)),
    []
  );
  const [serverId, setServerId] = useState(preferredIds[0] || STREAM_SERVERS[0].id);
  const [working, setWorking] = useState<WorkingServer[]>(
    preferredIds.map((id) => {
      const s = getServer(id);
      return {
        id: s.id,
        label: s.label,
        softSubs: s.softSubs,
        multiAudio: s.multiAudio,
        adRisk: s.adRisk,
      };
    })
  );
  const [audioOptions, setAudioOptions] = useState<LangOption[]>(initialAudio);
  const [subLangOptions, setSubLangOptions] = useState<LangOption[]>([]);
  const [tracksLoading, setTracksLoading] = useState(true);
  const [subLang, setSubLang] = useState('en');
  const [audioLang, setAudioLang] = useState(initialAudio[0]?.code || 'en');
  const [subUrl, setSubUrl] = useState<string | undefined>();
  const [reloadKey, setReloadKey] = useState(0);
  const [showServers, setShowServers] = useState(false);
  const [showLangs, setShowLangs] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('zoom');
  const [adShield, setAdShield] = useState(true);
  const failTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const coverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedRef = useRef(false);
  const prefsRef = useRef({ subLang, audioLang });
  prefsRef.current = { subLang, audioLang };

  useEffect(() => {
    setViewMode(readStoredView());
  }, []);

  const viewScale = VIEW_MODES.find((m) => m.id === viewMode)?.scale ?? 1;

  const cycleViewMode = useCallback(() => {
    setViewMode((cur) => {
      const idx = VIEW_MODES.findIndex((m) => m.id === cur);
      const next = VIEW_MODES[(idx + 1) % VIEW_MODES.length];
      try {
        window.localStorage.setItem(VIEW_STORAGE_KEY, next.id);
      } catch {
        // ignore
      }
      return next.id;
    });
  }, []);

  const server = getServer(serverId);
  const embedUrl = useMemo(
    () => server.buildUrl(target, { lang: subLang, audio: audioLang, subUrl }),
    [server, target, subLang, audioLang, subUrl]
  );

  const clearTimers = useCallback(() => {
    if (failTimer.current) clearTimeout(failTimer.current);
    if (coverTimer.current) clearTimeout(coverTimer.current);
    if (progressTimer.current) clearInterval(progressTimer.current);
    failTimer.current = null;
    coverTimer.current = null;
    progressTimer.current = null;
  }, []);

  const startProgress = useCallback(() => {
    setProgress(15);
    if (progressTimer.current) clearInterval(progressTimer.current);
    progressTimer.current = setInterval(() => {
      setProgress((p) => (p >= 90 ? 90 : p + Math.random() * 8 + 3));
    }, 280);
  }, []);

  const revealPlayer = useCallback(() => {
    setProgress(100);
    setPhase('ready');
    setStatusLine('');
    if (progressTimer.current) clearInterval(progressTimer.current);
  }, []);

  const tryServer = useCallback(
    (id: string, list: string[]) => {
      setServerId(id);
      setPhase('buffering');
      setAdShield(true);
      setStatusLine(`Loading ${getServer(id).label}...`);
      startProgress();

      if (failTimer.current) clearTimeout(failTimer.current);
      if (coverTimer.current) clearTimeout(coverTimer.current);

      failTimer.current = setTimeout(() => {
        const idx = list.indexOf(id);
        const next = list[idx + 1];
        if (next) {
          setReloadKey((k) => k + 1);
          tryServer(next, list);
        } else {
          setPhase('error');
          setStatusLine('Unable to start playback.');
        }
      }, FAIL_OVER_MS);
    },
    [startProgress]
  );

  const loadTracks = useCallback(async () => {
    setTracksLoading(true);
    try {
      const spoken = spokenParam(initialAudio);
      const q = targetQuery(target, {
        ...(imdbId ? { imdb: imdbId } : {}),
        ...(spoken ? { spoken } : {}),
      });
      const res = await fetch(`/api/tracks?${q}`, { cache: 'force-cache' });
      const data = await res.json();
      const audio = (data.audio as LangOption[]) || initialAudio;
      const subs = (data.subtitles as LangOption[]) || [];
      if (audio.length) {
        setAudioOptions(audio);
        setAudioLang((cur) => (audio.some((a) => a.code === cur) ? cur : audio[0].code));
      } else {
        setAudioOptions([]);
      }
      setSubLangOptions(subs);
      if (subs.length) {
        setSubLang((cur) => (subs.some((s) => s.code === cur) ? cur : subs[0].code));
      }
    } catch {
      setAudioOptions(initialAudio);
      setSubLangOptions(initialAudio.some((a) => a.code === 'en') ? [{ code: 'en', label: 'English' }] : []);
    } finally {
      setTracksLoading(false);
    }
  }, [imdbId, initialAudio, target]);

  const fetchSubFile = useCallback(
    async (code: string) => {
      if (!imdbId) {
        setSubUrl(undefined);
        return;
      }
      try {
        const q = targetQuery(target, { imdb: imdbId, mode: 'file', lang: code });
        const res = await fetch(`/api/tracks?${q}`, { cache: 'no-store' });
        const data = await res.json();
        setSubUrl(data?.subtitle?.url as string | undefined);
      } catch {
        setSubUrl(undefined);
      }
    },
    [imdbId, target]
  );

  const pickInBackground = useCallback(async () => {
    try {
      const { subLang: currentSub, audioLang: currentAudio } = prefsRef.current;
      const res = await fetch(`/api/stream/pick?${targetQuery(target, { lang: currentSub })}`, {
        cache: 'no-store',
      });
      const data = (await res.json()) as PickResponse;
      if (!data.working?.length) return;

      const ranked = rankServerIds(
        data.working.filter((w) => w.adRisk !== 'high').map((w) => w.id),
        currentAudio !== 'en'
      );
      const byId = new Map(data.working.map((w) => [w.id, w]));
      const ordered = ranked.map((id) => byId.get(id)!).filter(Boolean);
      if (!ordered.length) return;
      setWorking(ordered);

      // If still buffering on a high-ad host, hop to preferred clean one
      setServerId((cur) => {
        const preferred = ordered[0]?.id;
        if (!preferred) return cur;
        const curMeta = getServer(cur);
        if (curMeta.adRisk === 'high' && preferred !== cur) {
          setReloadKey((k) => k + 1);
          tryServer(
            preferred,
            ordered.map((w) => w.id)
          );
          return preferred;
        }
        return cur;
      });
    } catch {
      // keep optimistic list
    }
  }, [target, tryServer]);

  // Play immediately — don't wait for probe / tracks
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    clearTimers();
    tryServer(preferredIds[0] || STREAM_SERVERS[0].id, preferredIds);
    void pickInBackground();
    void loadTracks();
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once per target via key from parent
  }, [target.type, target.tmdbId, 'season' in target ? target.season : 0, 'episode' in target ? target.episode : 0]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = shellRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await el.requestFullscreen();
    } catch {
      // ignore
    }
  }, []);

  const onIframeLoad = () => {
    if (failTimer.current) {
      clearTimeout(failTimer.current);
      failTimer.current = null;
    }
    if (coverTimer.current) clearTimeout(coverTimer.current);
    setStatusLine('Almost ready...');
    setProgress((p) => Math.max(p, 75));
    coverTimer.current = setTimeout(() => revealPlayer(), COVER_AFTER_LOAD_MS);
  };

  const refreshAll = () => {
    startedRef.current = false;
    clearTimers();
    setPhase('buffering');
    setStatusLine('Refreshing...');
    const list = working.map((w) => w.id);
    const ids = list.length ? list : preferredIds;
    tryServer(ids[0], ids);
    void pickInBackground();
    void loadTracks();
    startedRef.current = true;
  };

  const applyReload = (next: { sub?: string; audio?: string }) => {
    if (next.sub) setSubLang(next.sub);
    if (next.audio) setAudioLang(next.audio);
    clearTimers();
    setPhase('buffering');
    setReloadKey((k) => k + 1);
    const list = working.map((w) => w.id);
    const preferAudio = (next.audio || audioLang) !== 'en';
    const ordered = rankServerIds(list.length ? list : preferredIds, preferAudio);
    tryServer(ordered[0] || serverId, ordered);
  };

  const changeSub = async (code: string) => {
    setShowLangs(false);
    await fetchSubFile(code);
    applyReload({ sub: code });
  };

  const changeAudio = (code: string) => {
    setShowLangs(false);
    applyReload({ audio: code });
  };

  const showOverlay = phase !== 'ready';
  const subLabel = subLangOptions.find((l) => l.code === subLang)?.label || subLang.toUpperCase();
  const audioLabel =
    audioOptions.find((l) => l.code === audioLang)?.label || audioLang.toUpperCase();
  const viewLabel = VIEW_MODES.find((m) => m.id === viewMode)?.label || 'Zoom';

  return (
    <div className="space-y-3">
      <div
        ref={shellRef}
        className={cn(
          'relative w-full overflow-hidden rounded-xl bg-black shadow-2xl ring-1 ring-border',
          isFullscreen ? 'h-screen rounded-none ring-0' : 'aspect-video'
        )}
      >
        {(phase === 'buffering' || phase === 'ready') && (
          <div className="absolute inset-0 overflow-hidden bg-black">
            <iframe
              key={`${embedUrl}-${reloadKey}`}
              src={embedUrl}
              title={title}
              className="absolute inset-0 h-full w-full border-0 transition-transform duration-300 ease-out"
              style={{
                transform: `scale(${viewScale})`,
                transformOrigin: 'center center',
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="no-referrer"
              onLoad={onIframeLoad}
            />
          </div>
        )}

        {/* Eats the first click so embed redirect-ads don't steal the tab */}
        {phase === 'ready' && adShield && (
          <button
            type="button"
            aria-label="Tap to watch — blocks ad redirects"
            onClick={() => setAdShield(false)}
            className="absolute inset-0 flex cursor-pointer items-end justify-center bg-transparent pb-16"
            style={{ zIndex: 25 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-black/75 px-4 py-2 text-xs font-medium text-white backdrop-blur">
              <Shield className="h-3.5 w-3.5 text-accent" />
              Tap to watch · ad shield on
            </span>
          </button>
        )}

        {phase === 'ready' && (
          <div className="absolute right-3 bottom-3 z-30 flex gap-2">
            <button
              type="button"
              onClick={cycleViewMode}
              aria-label={`Screen mode: ${viewLabel}`}
              title="Fit / Zoom / Fill — remove black bars"
              className="flex h-10 items-center gap-1.5 rounded-lg bg-black/70 px-3 text-xs font-semibold text-white backdrop-blur transition hover:bg-accent hover:text-background"
            >
              {viewMode === 'fit' ? (
                <Scan className="h-4 w-4" />
              ) : (
                <ZoomIn className="h-4 w-4" />
              )}
              {viewLabel}
            </button>
            <button
              type="button"
              onClick={() => void toggleFullscreen()}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/70 text-white backdrop-blur transition hover:bg-accent hover:text-background"
            >
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </button>
          </div>
        )}

        <AnimatePresence>
          {showOverlay && (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
              className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-5 bg-background"
            >
              <div className="relative h-14 w-14">
                <div className="h-14 w-14 rounded-full border-2 border-accent/25" />
                <Loader2 className="absolute inset-0 m-auto h-8 w-8 animate-spin text-accent" />
              </div>
              <div className="max-w-sm px-6 text-center">
                <p className="font-display text-3xl tracking-wide text-foreground">MOVIE WORLD</p>
                <p className="mt-2 text-sm text-muted">{statusLine || 'Loading...'}</p>
                <div className="mx-auto mt-4 h-1 w-44 overflow-hidden rounded-full bg-surface-2">
                  <motion.div
                    className="h-full rounded-full bg-accent"
                    initial={{ width: '12%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: 'easeOut', duration: 0.25 }}
                  />
                </div>
              </div>
              {phase === 'error' && (
                <button
                  type="button"
                  onClick={refreshAll}
                  className="mt-1 inline-flex h-10 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-background"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try again
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          {phase === 'ready' ? (
            <>
              <span className="inline-flex items-center gap-1">
                <Shield className="h-3.5 w-3.5 text-accent" />
                {adShield ? 'Ad shield ready' : 'Playing · CLEAN sources preferred'}
              </span>
              <span className="inline-flex items-center gap-1">
                <ZoomIn className="h-3.5 w-3.5 text-accent" />
                View: {viewLabel}
              </span>
              <span className="inline-flex items-center gap-1">
                <Volume2 className="h-3.5 w-3.5 text-accent" />
                {audioOptions.length ? audioLabel : '—'}
              </span>
              <span className="inline-flex items-center gap-1">
                <Captions className="h-3.5 w-3.5 text-accent" />
                {subLangOptions.length ? subLabel : tracksLoading ? '…' : 'no subs'}
              </span>
            </>
          ) : (
            'Loading…'
          )}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={cycleViewMode}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs text-muted transition hover:text-foreground"
          >
            <ZoomIn className="h-3.5 w-3.5" />
            {viewLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowLangs((v) => !v);
              setShowServers(false);
            }}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs text-muted transition hover:text-foreground"
          >
            <Languages className="h-3.5 w-3.5" />
            Audio / Subs
          </button>
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs text-muted transition hover:text-foreground"
          >
            {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
            Fullscreen
          </button>
          <button
            type="button"
            onClick={refreshAll}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs text-muted transition hover:text-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              setShowServers((v) => !v);
              setShowLangs(false);
            }}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs text-muted transition hover:text-foreground"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Sources{working.length ? ` (${working.length})` : ''}
          </button>
        </div>
      </div>

      {showLangs ? (
        <div className="space-y-4 rounded-xl border border-border bg-surface/40 p-3">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
              Audio · available for this title
            </p>
            {audioOptions.length === 0 ? (
              <p className="text-xs text-muted">No audio languages listed for this title.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {audioOptions.map((l) => (
                  <button
                    key={`a-${l.code}`}
                    type="button"
                    onClick={() => changeAudio(l.code)}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide transition',
                      l.code === audioLang
                        ? 'bg-accent text-background'
                        : 'border border-border text-muted hover:text-foreground'
                    )}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
              Subtitles · available for this {target.type === 'tv' ? 'episode' : 'movie'}
            </p>
            {tracksLoading ? (
              <p className="text-xs text-muted">Checking available subtitles…</p>
            ) : subLangOptions.length === 0 ? (
              <p className="text-xs text-muted">No subtitles found for this title yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {subLangOptions.map((l) => (
                  <button
                    key={`s-${l.code}`}
                    type="button"
                    onClick={() => void changeSub(l.code)}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide transition',
                      l.code === subLang
                        ? 'bg-accent text-background'
                        : 'border border-border text-muted hover:text-foreground'
                    )}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {showServers ? (
        <div className="rounded-xl border border-border bg-surface/40 p-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
            Working sources
          </p>
          <div className="flex flex-wrap gap-2">
            {working.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  clearTimers();
                  setReloadKey((k) => k + 1);
                  tryServer(
                    s.id,
                    working.map((w) => w.id)
                  );
                }}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide transition',
                  s.id === serverId
                    ? 'bg-accent text-background'
                    : 'border border-border text-muted hover:text-foreground'
                )}
              >
                {s.label}
                {s.softSubs ? ' · SUBS' : ''}
                {s.multiAudio ? ' · AUDIO' : ''}
                {s.adRisk === 'low' ? ' · CLEAN' : ''}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
