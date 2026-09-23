/**
 * Stream embed servers (TMDB id based).
 * Ranked for: soft-subs, lower ad risk, iframe friendliness.
 * Note: sandbox iframes are rejected by these hosts — do not use sandbox.
 */

export type StreamTarget =
  | { type: 'movie'; tmdbId: string | number }
  | { type: 'tv'; tmdbId: string | number; season: number; episode: number };

export type EmbedOptions = {
  /** ISO639-1 language for soft-subs */
  lang?: string;
  /** Preferred audio track language (when the host supports it) */
  audio?: string;
  /** Absolute .srt / .vtt URL for embeds that support sub_url */
  subUrl?: string;
};

export type AdRisk = 'low' | 'med' | 'high';

export type StreamServer = {
  id: string;
  name: string;
  label: string;
  softSubs?: boolean;
  multiAudio?: boolean;
  adRisk: AdRisk;
  buildUrl: (target: StreamTarget, opts?: EmbedOptions) => string;
};

export type LangOption = { code: string; label: string };

/** Subtitle languages we can request via ds_lang / sub */
export const SUBTITLE_LANGS: LangOption[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'it', label: 'Italian' },
  { code: 'ru', label: 'Russian' },
  { code: 'ar', label: 'Arabic' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh', label: 'Chinese' },
];

export type SubtitleLangCode = (typeof SUBTITLE_LANGS)[number]['code'];

function idOf(target: StreamTarget): string {
  return String(target.tmdbId);
}

function withParams(base: string, params: Record<string, string | undefined>): string {
  const url = new URL(base);
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }
  return url.toString();
}

export const STREAM_SERVERS: StreamServer[] = [
  {
    id: 'vidsrc-me',
    name: 'Alpha',
    label: 'ALPHA',
    softSubs: true,
    multiAudio: true,
    adRisk: 'low',
    buildUrl: (t, opts) => {
      const lang = opts?.lang || 'en';
      const base =
        t.type === 'movie'
          ? `https://vidsrc.me/embed/movie?tmdb=${idOf(t)}`
          : `https://vidsrc.me/embed/tv?tmdb=${idOf(t)}&season=${t.season}&episode=${t.episode}`;
      return withParams(base, {
        ds_lang: lang,
        audio_lang: opts?.audio,
        sub_url: opts?.subUrl,
        autoplay: '1',
      });
    },
  },
  {
    id: 'vidsrc-embed',
    name: 'Beta',
    label: 'BETA',
    softSubs: true,
    multiAudio: true,
    adRisk: 'low',
    buildUrl: (t, opts) => {
      const lang = opts?.lang || 'en';
      const base =
        t.type === 'movie'
          ? `https://vidsrc-embed.ru/embed/movie?tmdb=${idOf(t)}`
          : `https://vidsrc-embed.ru/embed/tv?tmdb=${idOf(t)}&season=${t.season}&episode=${t.episode}`;
      return withParams(base, {
        ds_lang: lang,
        audio_lang: opts?.audio,
        sub_url: opts?.subUrl,
        autoplay: '1',
      });
    },
  },
  {
    id: 'vidsrc-sbs',
    name: 'Gamma',
    label: 'GAMMA',
    softSubs: true,
    multiAudio: true,
    adRisk: 'low',
    buildUrl: (t, opts) => {
      const lang = opts?.lang || 'en';
      const path =
        t.type === 'movie'
          ? `https://vidsrc.sbs/embed/movie/${idOf(t)}`
          : `https://vidsrc.sbs/embed/tv/${idOf(t)}/${t.season}/${t.episode}`;
      return withParams(path, {
        sub: lang,
        audio: opts?.audio,
        autoplay: '1',
        sub_url: opts?.subUrl,
      });
    },
  },
  {
    id: 'vidsrc-su',
    name: 'Delta',
    label: 'DELTA',
    softSubs: true,
    multiAudio: true,
    adRisk: 'med',
    buildUrl: (t, opts) => {
      const path =
        t.type === 'movie'
          ? `https://vidsrc.su/movie/${idOf(t)}`
          : `https://vidsrc.su/tv/${idOf(t)}/${t.season}/${t.episode}`;
      return withParams(path, {
        autoplay: 'true',
        colour: 'e8a317',
        sub_url: opts?.subUrl,
        audio: opts?.audio,
      });
    },
  },
  {
    id: 'smashy',
    name: 'Echo',
    label: 'ECHO',
    softSubs: true,
    multiAudio: true,
    adRisk: 'med',
    buildUrl: (t, opts) => {
      const lang = opts?.lang || 'en';
      if (t.type === 'movie') {
        return withParams(`https://player.smashystream.com/movie/${idOf(t)}`, {
          sub: lang,
          audio: opts?.audio,
          sub_url: opts?.subUrl,
        });
      }
      return withParams(
        `https://player.smashystream.com/tv/${idOf(t)}?s=${t.season}&e=${t.episode}`,
        { sub: lang, audio: opts?.audio, sub_url: opts?.subUrl }
      );
    },
  },
  {
    id: '2embed',
    name: 'Zeta',
    label: 'ZETA',
    softSubs: false,
    multiAudio: false,
    adRisk: 'med',
    buildUrl: (t) =>
      t.type === 'movie'
        ? `https://www.2embed.cc/embed/${idOf(t)}`
        : `https://www.2embed.cc/embedtv/${idOf(t)}/${t.season}/${t.episode}`,
  },
  {
    id: 'moviesapi',
    name: 'Theta',
    label: 'THETA',
    softSubs: false,
    multiAudio: false,
    adRisk: 'med',
    buildUrl: (t) =>
      t.type === 'movie'
        ? `https://moviesapi.to/movie/${idOf(t)}`
        : `https://moviesapi.to/tv/${idOf(t)}-${t.season}-${t.episode}`,
  },
  {
    id: 'videasy',
    name: 'Sigma',
    label: 'SIGMA',
    softSubs: false,
    multiAudio: true,
    adRisk: 'high',
    buildUrl: (t, opts) => {
      const path =
        t.type === 'movie'
          ? `https://player.videasy.net/movie/${idOf(t)}`
          : `https://player.videasy.net/tv/${idOf(t)}/${t.season}/${t.episode}`;
      return withParams(path, {
        autoplay: 'true',
        audio: opts?.audio,
        sub: opts?.lang,
      });
    },
  },
  {
    id: 'vidlink',
    name: 'Omega',
    label: 'OMEGA',
    softSubs: false,
    multiAudio: false,
    adRisk: 'high',
    buildUrl: (t) =>
      t.type === 'movie'
        ? `https://vidlink.pro/movie/${idOf(t)}?autoplay=true&pausescreen=false`
        : `https://vidlink.pro/tv/${idOf(t)}/${t.season}/${t.episode}?autoplay=true&pausescreen=false&autonextepisode=true`,
  },
];

const AD_SCORE: Record<AdRisk, number> = { low: 0, med: 1, high: 2 };

export function getServer(id: string | null | undefined): StreamServer {
  return STREAM_SERVERS.find((s) => s.id === id) ?? STREAM_SERVERS[0];
}

export function softSubServerIds(): string[] {
  return STREAM_SERVERS.filter((s) => s.softSubs).map((s) => s.id);
}

export function multiAudioServerIds(): string[] {
  return STREAM_SERVERS.filter((s) => s.multiAudio).map((s) => s.id);
}

/** Prefer soft-subs, then multi-audio, then lower ad risk */
export function rankServerIds(ids: string[], preferAudio = false): string[] {
  return [...ids].sort((a, b) => {
    const sa = getServer(a);
    const sb = getServer(b);
    if (preferAudio) {
      const aAud = sa.multiAudio ? 0 : 1;
      const bAud = sb.multiAudio ? 0 : 1;
      if (aAud !== bAud) return aAud - bAud;
    }
    const aSub = sa.softSubs ? 0 : 1;
    const bSub = sb.softSubs ? 0 : 1;
    if (aSub !== bSub) return aSub - bSub;
    const ad = AD_SCORE[sa.adRisk] - AD_SCORE[sb.adRisk];
    if (ad !== 0) return ad;
    if (a === 'vidlink') return 1;
    if (b === 'vidlink') return -1;
    return 0;
  });
}

export function nextServerId(currentId: string): string {
  const idx = STREAM_SERVERS.findIndex((s) => s.id === currentId);
  const next = STREAM_SERVERS[(idx + 1) % STREAM_SERVERS.length];
  return next.id;
}

export function watchMoviePath(tmdbId: string | number, serverId?: string): string {
  const base = `/watch/movie/${tmdbId}`;
  return serverId ? `${base}?server=${serverId}` : base;
}

export function watchTvPath(
  tmdbId: string | number,
  season: number,
  episode: number,
  serverId?: string
): string {
  const base = `/watch/tv/${tmdbId}/${season}/${episode}`;
  return serverId ? `${base}?server=${serverId}` : base;
}

/** Build unique audio options from TMDB spoken_languages + original_language only */
export function audioLangsFromTmdb(input: {
  original_language?: string | null;
  spoken_languages?: { iso_639_1: string; english_name: string; name?: string }[];
}): LangOption[] {
  const map = new Map<string, string>();
  for (const s of input.spoken_languages || []) {
    const code = (s.iso_639_1 || '').toLowerCase();
    if (!code) continue;
    map.set(code, s.english_name || s.name || code.toUpperCase());
  }
  const orig = (input.original_language || '').toLowerCase();
  if (orig && !map.has(orig)) {
    const known = SUBTITLE_LANGS.find((l) => l.code === orig);
    map.set(orig, known?.label || orig.toUpperCase());
  }
  return Array.from(map.entries()).map(([code, label]) => ({ code, label }));
}
