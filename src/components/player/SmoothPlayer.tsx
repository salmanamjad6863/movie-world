'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Languages, Loader2, RefreshCw, Settings2 } from 'lucide-react';
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

const COVER_AFTER_LOAD_MS = 1800;
const FAIL_OVER_MS = 9000;
const PLAY_MESSAGE_TYPES = new Set(['PLAYER_TITLE', 'TV_INFO', 'PLAYER_UI', 'TV_STATE', 'PLAYER_EVENT']);

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

export function SmoothPlayer({ target, title, audioLanguages, imdbId }: Props) {
  const initialAudio = useMemo(
    () => (audioLanguages?.length ? audioLanguages : []),
    [audioLanguages]
  );

  const [phase, setPhase] = useState<'buffering' | 'ready' | 'error'>('buffering');
  const [statusLine, setStatusLine] = useState('Starting playback...');
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

  const failTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const coverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedRef = useRef(false);
  const confirmedRef = useRef(false);
  const serverIdRef = useRef(serverId);
  const workingRef = useRef(working);
  const prefsRef = useRef({ subLang, audioLang });
  prefsRef.current = { subLang, audioLang };
  serverIdRef.current = serverId;
  workingRef.current = working;

  const server = getServer(serverId);
  const embedUrl = useMemo(
    () => server.buildUrl(target, { lang: subLang, audio: audioLang, subUrl }),
    [server, target, subLang, audioLang, subUrl]
  );

  const clearTimers = useCallback(() => {
    if (failTimer.current) clearTimeout(failTimer.current);
    if (coverTimer.current) clearTimeout(coverTimer.current);
    failTimer.current = null;
    coverTimer.current = null;
  }, []);

  const revealPlayer = useCallback(() => {
    setPhase('ready');
    setStatusLine('');
  }, []);

  const tryServer = useCallback(
    (id: string, list: string[]) => {
      confirmedRef.current = false;
      setServerId(id);
      setPhase('buffering');
      setShowLangs(false);
      setShowServers(false);
      setStatusLine(`Loading ${getServer(id).label}...`);

      if (failTimer.current) clearTimeout(failTimer.current);
      if (coverTimer.current) clearTimeout(coverTimer.current);

      failTimer.current = setTimeout(() => {
        if (confirmedRef.current) return;
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
    []
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
      setSubLangOptions(
        initialAudio.some((a) => a.code === 'en') ? [{ code: 'en', label: 'English' }] : []
      );
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

      setServerId((cur) => {
        const preferred = ordered[0]?.id;
        if (!preferred) return cur;
        if (confirmedRef.current) return cur;
        const curWorking = ordered.some((w) => w.id === cur);
        const curMeta = getServer(cur);
        if (preferred !== cur && (!curWorking || curMeta.adRisk === 'high')) {
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

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    clearTimers();
    tryServer(preferredIds[0] || STREAM_SERVERS[0].id, preferredIds);
    void pickInBackground();
    void loadTracks();
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once per target
  }, [target.type, target.tmdbId, 'season' in target ? target.season : 0, 'episode' in target ? target.episode : 0]);

  const markConfirmed = useCallback(() => {
    if (confirmedRef.current) return;
    confirmedRef.current = true;
    if (failTimer.current) {
      clearTimeout(failTimer.current);
      failTimer.current = null;
    }
    revealPlayer();
  }, [revealPlayer]);

  const onIframeLoad = () => {
    if (coverTimer.current) clearTimeout(coverTimer.current);
    setStatusLine('Almost ready...');
    coverTimer.current = setTimeout(() => markConfirmed(), COVER_AFTER_LOAD_MS);
  };

  const failOverNow = useCallback(() => {
    if (confirmedRef.current) return;
    const list = workingRef.current.map((w) => w.id);
    const ids = list.length ? list : preferredIds;
    const cur = serverIdRef.current;
    const next = ids[ids.indexOf(cur) + 1];
    if (next) {
      setReloadKey((k) => k + 1);
      tryServer(next, ids);
    } else {
      setPhase('error');
      setStatusLine('Unable to start playback.');
    }
  }, [preferredIds, tryServer]);

  useEffect(() => {
    const onMsg = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;
      const type = (data as { type?: string }).type;
      if (!type) return;
      if (PLAY_MESSAGE_TYPES.has(type)) markConfirmed();
      if (type === 'MEDIA_NOT_FOUND') failOverNow();
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [failOverNow, markConfirmed]);

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

  return (
    <div className="space-y-3">
      <div className="player-shell relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-2xl ring-1 ring-border">
        {(phase === 'buffering' || phase === 'ready') && (
          <iframe
            key={`${embedUrl}-${reloadKey}`}
            src={embedUrl}
            title={title}
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="origin"
            onLoad={onIframeLoad}
            onError={failOverNow}
          />
        )}

        <AnimatePresence>
          {showOverlay && (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black"
            >
              {phase === 'error' ? (
                <>
                  <p className="px-6 text-center text-sm text-white/70">
                    {statusLine || 'Unable to start playback.'}
                  </p>
                  <button
                    type="button"
                    onClick={refreshAll}
                    className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-5 text-sm font-semibold text-background"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Try again
                  </button>
                </>
              ) : (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                  <p className="text-sm text-white/60">{statusLine || 'Loading…'}</p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Utility controls below the embed — do not cover native player UI */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">
          {phase === 'ready'
            ? `${server.label}${audioOptions.length ? ` · ${audioLabel}` : ''}${subLangOptions.length ? ` · ${subLabel}` : ''}`
            : 'Loading…'}
        </p>
        <div className="flex flex-wrap items-center gap-2">
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
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Audio</p>
            {audioOptions.length === 0 ? (
              <p className="text-xs text-muted">No audio languages listed.</p>
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
              Subtitles
            </p>
            {tracksLoading ? (
              <p className="text-xs text-muted">Checking subtitles…</p>
            ) : subLangOptions.length === 0 ? (
              <p className="text-xs text-muted">No subtitles found.</p>
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
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Sources</p>
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
                {s.adRisk === 'low' ? ' · Clean' : ''}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
