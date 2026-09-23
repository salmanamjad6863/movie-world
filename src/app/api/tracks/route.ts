import { NextRequest, NextResponse } from 'next/server';
import { findLegacySubtitleFile, listAvailableSubtitleLanguages } from '@/lib/subtitles';
import type { LangOption } from '@/lib/stream-servers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/tracks
 * Returns only audio/subtitle languages available for this title/episode.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const type = sp.get('type');
  const tmdbId = sp.get('id');
  const imdb = sp.get('imdb') || '';
  const season = Number(sp.get('season') || 0) || undefined;
  const episode = Number(sp.get('episode') || 0) || undefined;
  const lang = sp.get('lang');
  const mode = sp.get('mode') || 'list';

  if (!tmdbId || (type !== 'movie' && type !== 'tv')) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
  }

  const spokenRaw = sp.get('spoken') || '';
  let audio: LangOption[] = [];
  if (spokenRaw) {
    audio = spokenRaw
      .split('|')
      .map((part) => {
        const [code, ...rest] = part.split(',');
        if (!code) return null;
        return { code: code.toLowerCase(), label: rest.join(',') || code.toUpperCase() };
      })
      .filter(Boolean) as LangOption[];
  }

  if (mode === 'file' && lang && imdb) {
    try {
      const cue = await findLegacySubtitleFile({
        imdbId: imdb,
        lang,
        season: type === 'tv' ? season : undefined,
        episode: type === 'tv' ? episode : undefined,
      });
      if (!cue) {
        return NextResponse.json({ subtitle: null });
      }
      const origin = req.nextUrl.origin;
      const proxy = `${origin}/api/tracks/file?src=${encodeURIComponent(cue.url)}`;
      return NextResponse.json({
        subtitle: { ...cue, url: proxy },
      });
    } catch (err) {
      return NextResponse.json({
        subtitle: null,
        error: err instanceof Error ? err.message : 'lookup failed',
      });
    }
  }

  let subtitles: LangOption[] = [];
  if (imdb) {
    try {
      subtitles = await listAvailableSubtitleLanguages({
        imdbId: imdb,
        season: type === 'tv' ? season : undefined,
        episode: type === 'tv' ? episode : undefined,
      });
    } catch {
      subtitles = [];
    }
  }

  if (!subtitles.length) {
    const en = audio.find((a) => a.code === 'en');
    if (en) subtitles = [{ code: 'en', label: 'English' }];
  }

  return NextResponse.json(
    {
      audio,
      subtitles,
      imdb: imdb || null,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600',
      },
    }
  );
}
