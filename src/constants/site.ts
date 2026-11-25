/**
 * Site configuration for SEO and metadata
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'Movie World';

export const SITE_DESCRIPTION =
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
  'Discover movies and TV seasons. Browse trending titles, explore episodes, and find what to watch next.';

export const SITE_TITLE_DEFAULT = `${SITE_NAME} — Movies & TV Seasons`;

export const SITE_TAGLINE = 'Movies & TV seasons in one place';

export const SITE_LOCALE = 'en_US';

export const SITE_THEME_COLOR = '#07070a';

export const SITE_ACCENT = '#e8a317';

export const SITE_TWITTER =
  process.env.NEXT_PUBLIC_SITE_TWITTER || undefined;

export function absoluteUrl(path = '/'): string {
  const base = SITE_URL.replace(/\/$/, '');
  if (!path || path === '/') return base;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
