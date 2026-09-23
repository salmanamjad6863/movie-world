import { NextRequest, NextResponse } from 'next/server';
import {
  STREAM_SERVERS,
  rankServerIds,
  type StreamTarget,
} from '@/lib/stream-servers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ProbeResult = {
  id: string;
  label: string;
  url: string;
  ok: boolean;
  softSubs?: boolean;
  multiAudio?: boolean;
  adRisk?: string;
  status?: number;
  reason?: string;
};

type CacheEntry = { at: number; body: unknown };
const pickCache = new Map<string, CacheEntry>();
const CACHE_MS = 5 * 60 * 1000;

async function probeEmbed(url: string): Promise<{ ok: boolean; status?: number; reason?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3200);
  try {
    // HEAD first (faster); fall back to GET if rejected
    let res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
        },
      });
    }

    const xfo = (res.headers.get('x-frame-options') || '').toLowerCase();
    const csp = (res.headers.get('content-security-policy') || '').toLowerCase();

    if (!res.ok && res.status !== 204) {
      return { ok: false, status: res.status, reason: `http_${res.status}` };
    }
    if (xfo.includes('deny') || xfo === 'sameorigin') {
      return { ok: false, status: res.status, reason: 'x_frame_blocked' };
    }
    if (csp.includes('frame-ancestors') && csp.includes("'none'")) {
      return { ok: false, status: res.status, reason: 'csp_frame_blocked' };
    }
    return { ok: true, status: res.status };
  } catch {
    return { ok: false, reason: 'timeout_or_network' };
  } finally {
    clearTimeout(timer);
  }
}

function parseTarget(req: NextRequest): StreamTarget | null {
  const { searchParams } = req.nextUrl;
  const type = searchParams.get('type');
  const id = searchParams.get('id');
  if (!id || (type !== 'movie' && type !== 'tv')) return null;

  if (type === 'movie') return { type: 'movie', tmdbId: id };

  const season = Number(searchParams.get('season') || 1);
  const episode = Number(searchParams.get('episode') || 1);
  if (!Number.isFinite(season) || !Number.isFinite(episode)) return null;
  return { type: 'tv', tmdbId: id, season, episode };
}

function cacheKey(target: StreamTarget, lang: string): string {
  if (target.type === 'movie') return `m:${target.tmdbId}:${lang}`;
  return `t:${target.tmdbId}:${target.season}:${target.episode}:${lang}`;
}

export async function GET(req: NextRequest) {
  const target = parseTarget(req);
  if (!target) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
  }
  const resolvedTarget = target;

  const lang = req.nextUrl.searchParams.get('lang') || 'en';
  const key = cacheKey(resolvedTarget, lang);
  const cached = pickCache.get(key);
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return NextResponse.json(cached.body, {
      headers: { 'Cache-Control': 'private, max-age=60', 'X-Cache': 'HIT' },
    });
  }

  const embedOpts = { lang };

  // Probe preferred (low-ad / soft-sub) hosts first; stop early once we have enough
  const orderedServers = rankServerIds(STREAM_SERVERS.map((s) => s.id)).map((id) =>
    STREAM_SERVERS.find((s) => s.id === id)!
  );

  const probes: ProbeResult[] = [];
  const concurrency = 4;
  let idx = 0;

  async function runOne(server: (typeof STREAM_SERVERS)[number]) {
    const url = server.buildUrl(resolvedTarget, embedOpts);
    const result = await probeEmbed(url);
    probes.push({
      id: server.id,
      label: server.label,
      url,
      ok: result.ok,
      softSubs: server.softSubs,
      multiAudio: server.multiAudio,
      adRisk: server.adRisk,
      status: result.status,
      reason: result.reason,
    });
  }

  while (idx < orderedServers.length) {
    const batch = orderedServers.slice(idx, idx + concurrency);
    idx += concurrency;
    await Promise.all(batch.map(runOne));
    const workingCount = probes.filter((p) => p.ok).length;
    if (workingCount >= 3) break; // enough for UI + failover
  }

  const workingRaw = probes.filter((p) => p.ok);
  const rankedIds = rankServerIds(workingRaw.map((p) => p.id));
  const byId = new Map(workingRaw.map((p) => [p.id, p]));
  const working = rankedIds.map((id) => byId.get(id)!).filter(Boolean);
  const preferred = working[0] ?? null;

  const body = {
    preferred: preferred
      ? {
          id: preferred.id,
          label: preferred.label,
          url: preferred.url,
          softSubs: preferred.softSubs,
          adRisk: preferred.adRisk,
        }
      : null,
    working: working.map((p) => ({
      id: p.id,
      label: p.label,
      url: p.url,
      softSubs: p.softSubs,
      multiAudio: p.multiAudio,
      adRisk: p.adRisk,
    })),
    probed: probes,
  };

  pickCache.set(key, { at: Date.now(), body });

  return NextResponse.json(body, {
    headers: {
      'Cache-Control': 'private, max-age=60',
      'X-Cache': 'MISS',
    },
  });
}
