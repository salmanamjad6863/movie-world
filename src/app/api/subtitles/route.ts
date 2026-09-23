import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** @deprecated Use /api/tracks — kept as a thin redirect for older clients */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = '/api/tracks';
  if (url.searchParams.get('list') === '1') {
    url.searchParams.delete('list');
    url.searchParams.set('mode', 'list');
  }
  return NextResponse.redirect(url);
}
