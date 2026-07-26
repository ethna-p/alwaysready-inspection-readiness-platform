import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'AlwaysReady — Inspection Readiness Platform'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#014D4E',
          position: 'relative',
        }}
      >
        {/* Gold accent bar at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '8px',
            backgroundColor: '#ffd700',
          }}
        />

        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://portal.alwaysready.uk/logo-email.png"
          alt="AlwaysReady"
          width={440}
          height={96}
          style={{ marginBottom: '36px' }}
        />

        {/* Tagline */}
        <div
          style={{
            fontSize: '36px',
            fontWeight: '400',
            color: '#80cbc4',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          Inspection Readiness Platform
        </div>
      </div>
    ),
    { ...size }
  )
}
