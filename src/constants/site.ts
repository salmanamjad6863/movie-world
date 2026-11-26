/**
 * Site configuration for SEO and metadata
 */

function normalizeSiteUrl(value: string): string {
  const trimmed = value.trim().replace(/\/$/, '');
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return normalizeSiteUrl(explicit);

  // Prefer the stable production domain over ephemeral deployment URLs
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) return normalizeSiteUrl(production);

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return normalizeSiteUrl(vercel);

  return 'http://localhost:3000';
}

export const SITE_URL = resolveSiteUrl();

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'Movie World';

export const SITE_DESCRIPTION =
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
  'Watch free movies and free TV seasons online. Browse trending films, popular series, and new releases on Movie World.';

export const SITE_TITLE_DEFAULT = `${SITE_NAME} — Free Movies & TV Seasons Online`;

export const SITE_TAGLINE = 'Free movies & TV seasons online';

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
