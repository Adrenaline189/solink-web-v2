// app/opengraph-image.tsx
import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0b1220 0%, #0b1220 50%, #0f172a 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            width: 1000,
            color: 'white',
            fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              opacity: 0.9,
              fontSize: 22,
              letterSpacing: 1,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #22d3ee 0%, #6366f1 100%)',
              }}
            />
            <span>Solink</span>
          </div>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.1 }}>
            Share bandwidth. Earn rewards.
          </div>
          <div style={{ fontSize: 26, color: '#cbd5e1', maxWidth: 900 }}>
            Simple, secure, and rewarding — built for developers and enterprises.
          </div>
        </div>
      </div>
    ),
    size
  );
}
