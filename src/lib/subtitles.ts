/**
 * Subtitle discovery via OpenSubtitles legacy REST (no consumer key).
 * Lists only languages that actually exist for the IMDb title / episode.
 */

import { SUBTITLE_LANGS, type LangOption } from '@/lib/stream-servers';

export type SubtitleCue = {
  label: string;
  lang: string;
  url: string;
  source: 'opensubtitles-legacy' | 'opensubtitles';
};

type LegacyItem = {
  ISO639?: string;
  SubLanguageID?: string;
  LanguageName?: string;
  SubDownloadLink?: string;
  SubFormat?: string;
  SubFileName?: string;
  SeriesSeason?: string;
  SeriesEpisode?: string;
};

const LEGACY_BASE = 'https://rest.opensubtitles.org';
const LABEL_BY_CODE = new Map(SUBTITLE_LANGS.map((l) => [l.code, l.label]));

function normalizeImdb(id: string): string {
  return id.replace(/^tt/i, '').replace(/\D/g, '');
}

function langLabel(code: string, fallback?: string): string {
  return LABEL_BY_CODE.get(code) || fallback || code.toUpperCase();
}

async function legacySearch(path: string): Promise<LegacyItem[]> {
  const res = await fetch(`${LEGACY_BASE}${path}`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'TemporaryUserAgent',
      'X-User-Agent': 'MovieWorld v1.0',
    },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  const data = await res.json().catch(() => null);
  return Array.isArray(data) ? (data as LegacyItem[]) : [];
}

function buildSearchPath(params: {
  imdbId: string;
  season?: number;
  episode?: number;
}): string {
  const imdb = normalizeImdb(params.imdbId);
  if (params.season && params.episode) {
    return `/search/episode-${params.episode}/imdbid-${imdb}/season-${params.season}`;
  }
  return `/search/imdbid-${imdb}`;
}

/** Distinct subtitle languages available for this title/episode */
export async function listAvailableSubtitleLanguages(params: {
  imdbId: string;
  season?: number;
  episode?: number;
}): Promise<LangOption[]> {
  const items = await legacySearch(buildSearchPath(params));
  const map = new Map<string, string>();

  for (const item of items) {
    const code = (item.ISO639 || item.SubLanguageID || '').toLowerCase().slice(0, 2);
    if (!code || code === 'pb') {
      // pb = Brazilian Portuguese → map to pt
      if ((item.ISO639 || '').toLowerCase() === 'pb') {
        map.set('pt', langLabel('pt', 'Portuguese'));
      }
      continue;
    }
    if (!map.has(code)) {
      map.set(code, langLabel(code, item.LanguageName));
    }
  }

  // Prefer common languages first
  const preferred = ['en', 'es', 'fr', 'de', 'pt', 'it', 'ru', 'ar', 'hi', 'ja', 'ko', 'zh'];
  const ordered = [
    ...preferred.filter((c) => map.has(c)),
    ...[...map.keys()].filter((c) => !preferred.includes(c)).sort(),
  ];

  return ordered.map((code) => ({ code, label: map.get(code)! }));
}

/** Pick a downloadable subtitle file for a language; returns legacy gz URL */
export async function findLegacySubtitleFile(params: {
  imdbId: string;
  lang: string;
  season?: number;
  episode?: number;
}): Promise<SubtitleCue | null> {
  const items = await legacySearch(buildSearchPath(params));
  const want = params.lang.toLowerCase().slice(0, 2);
  const match = items.find((i) => {
    const code = (i.ISO639 || i.SubLanguageID || '').toLowerCase();
    if (want === 'pt' && (code === 'pt' || code === 'pb' || code === 'pob')) return Boolean(i.SubDownloadLink);
    return code.slice(0, 2) === want && Boolean(i.SubDownloadLink);
  });
  if (!match?.SubDownloadLink) return null;

  return {
    label: match.SubFileName || match.LanguageName || params.lang,
    lang: want,
    url: match.SubDownloadLink,
    source: 'opensubtitles-legacy',
  };
}

/** Optional OpenSubtitles.com v1 (consumer key) — kept for richer downloads */
export function isOpenSubtitlesConfigured(): boolean {
  return Boolean(process.env.OPENSUBTITLES_API_KEY?.trim());
}
