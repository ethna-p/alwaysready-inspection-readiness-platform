'use client'

/**
 * Last-resort error boundary: catches errors thrown by the root layout itself, where
 * no other boundary can render. It replaces the whole document, so it must supply its
 * own <html> and <body> and cannot rely on the app's stylesheet; everything here is
 * inline-styled. Reports to Sentry (the documented way to capture App Router render
 * errors) and keeps the required legal footer.
 */
import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import SiteFooter from '@/components/SiteFooter'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#faf9f6',
          color: '#1a1a1a',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        }}
      >
        <main style={{ maxWidth: 560, margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center', width: '100%' }}>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Something went wrong</h1>
          <p role="alert" style={{ marginTop: '0.75rem', color: '#374151', lineHeight: 1.6 }}>
            The site hit a problem on our side. Please try again. If it keeps happening, email{' '}
            <a href="mailto:support@alwaysready.uk" style={{ color: '#014D4E' }}>
              support@alwaysready.uk
            </a>
            {error.digest ? <> and quote the reference <code>{error.digest}</code></> : null}.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '2rem',
              padding: '0.65rem 1.25rem',
              border: 0,
              borderRadius: 8,
              background: '#00b8a6',
              color: '#1a1a1a',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </main>
        <SiteFooter />
      </body>
    </html>
  )
}
