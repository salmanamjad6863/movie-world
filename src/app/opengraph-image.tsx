import { ImageResponse } from 'next/og';
import { SITE_NAME, SITE_TAGLINE } from '@/constants/site';

export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: 'linear-gradient(145deg, #0c0c12 0%, #07070a 45%, #121018 100%)',
          color: '#f5f5f7',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'linear-gradient(145deg, #e8a317 0%, #c47d0a 100%)',
            }}
          />
          <div
            style={{
              fontSize: 28,
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: '#e8a317',
              fontWeight: 600,
            }}
          >
            Cinema catalog
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div
            style={{
              fontSize: 88,
              fontWeight: 700,
              letterSpacing: -2,
              lineHeight: 1,
            }}
          >
            {SITE_NAME}
          </div>
          <div
            style={{
              fontSize: 34,
              color: 'rgba(245,245,247,0.72)',
              maxWidth: 820,
              lineHeight: 1.3,
            }}
          >
            {SITE_TAGLINE}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 22,
            color: 'rgba(245,245,247,0.55)',
          }}
        >
          <span>Movies · Series · Seasons</span>
          <span style={{ color: '#e8a317' }}>Discover what to watch next</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
