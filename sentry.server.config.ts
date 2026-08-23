/**
 * Sentry server-side (Node.js) configuration.
 * Loaded via instrumentation.ts when NEXT_RUNTIME === 'nodejs'.
 */
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
})
