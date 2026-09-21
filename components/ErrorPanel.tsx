'use client'

/**
 * ErrorPanel: the message shown when a page fails to render.
 *
 * Used by app/error.tsx (any page outside the dashboard) and app/dashboard/error.tsx
 * (inside the dashboard, so the header and footer stay). It reports the error to Sentry
 * once, and shows plain-English guidance plus the error's digest as a reference that
 * support can match to the report.
 *
 * Deliberately makes no promise that anyone has been told about the problem: whether
 * Sentry is receiving events depends on configuration this component cannot check.
 */
import { useEffect } from 'react'
import Link from 'next/link'
import * as Sentry from '@sentry/nextjs'

export default function ErrorPanel({
  error,
  reset,
  homeHref = '/',
  homeLabel = 'Back to the start',
}: {
  error: Error & { digest?: string }
  reset: () => void
  homeHref?: string
  homeLabel?: string
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-16 text-center">
      <h1 className="text-2xl font-bold text-ink">Something went wrong</h1>
      <p role="alert" className="mt-3 text-ink-dim">
        This page hit a problem on our side. Please try again. If it keeps happening, email{' '}
        <a href="mailto:support@alwaysready.uk" className="text-brand underline">
          support@alwaysready.uk
        </a>
        {error.digest ? (
          <>
            {' '}and quote the reference <span className="font-mono text-ink">{error.digest}</span>
          </>
        ) : null}
        .
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg px-5 py-2.5 text-sm font-semibold"
          style={{ background: '#00b8a6', color: '#1a1a1a' }}
        >
          Try again
        </button>
        <Link href={homeHref} className="text-sm font-medium text-brand underline">
          {homeLabel}
        </Link>
      </div>
    </main>
  )
}
