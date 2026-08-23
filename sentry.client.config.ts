/**
 * Sentry client-side configuration.
 * Runs in the browser — keep imports lean.
 *
 * DSN is EU-residency (ingest.de.sentry.io) — all data stays in Germany.
 */
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 10 % of transactions for performance monitoring
  tracesSampleRate: 0.1,

  // Record a session replay for every error, but don't sample regular sessions
  // (session replay can be expensive on bandwidth and storage)
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.0,
  integrations: [Sentry.replayIntegration()],
})
