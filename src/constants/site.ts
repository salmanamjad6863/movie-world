/**
 * Site configuration for SEO and metadata
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export const SITE_NAME =
  process.env.NEXT_PUBLIC_SITE_NAME || 'Movie World';

export const SITE_DESCRIPTION =
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
  'Discover movies and TV seasons. Browse trending titles, explore episodes, and track what to watch next.';

export const SITE_TITLE_DEFAULT = `${SITE_NAME} — Movies & TV Seasons`;
