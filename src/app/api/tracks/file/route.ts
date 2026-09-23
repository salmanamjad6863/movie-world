import { NextRequest, NextResponse } from 'next/server';
import { gunzipSync } from 'zlib';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Proxy OpenSubtitles .gz/.srt downloads as .vtt for embed sub_url.
 * GET /api/tracks/file?src=<encoded SubDownloadLink>
 */
export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get('src');
  if (!src || !/^https:\/\/dl\.opensubtitles\.org\//i.test(src)) {
    return NextResponse.json({ error: 'Invalid source' }, { status: 400 });
  }

  try {
    const res = await fetch(src, {
      headers: {
        'User-Agent': 'TemporaryUserAgent',
        'X-User-Agent': 'MovieWorld v1.0',
      },
      redirect: 'follow',
    });
    if (!res.ok) {
      return NextResponse.json({ error: `Upstream ${res.status}` }, { status: 502 });
    }

    const buf = Buffer.from(await res.arrayBuffer());
    let text: string;
    try {
      text = gunzipSync(buf).toString('utf8');
    } catch {
      text = buf.toString('utf8');
    }

    const vtt = srtToVtt(text);
    return new NextResponse(vtt, {
      status: 200,
      headers: {
        'Content-Type': 'text/vtt; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'proxy failed' },
      { status: 502 }
    );
  }
}

function srtToVtt(input: string): string {
  const trimmed = input.replace(/^\uFEFF/, '').trim();
  if (trimmed.startsWith('WEBVTT')) return trimmed;

  const body = trimmed
    .replace(/\r+/g, '')
    .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');

  return `WEBVTT\n\n${body}\n`;
}
