/**
 * Sentry browser-side initialisation.
 *
 * This file replaces the old sentry.client.config.ts. The site builds with
 * Turbopack, and @sentry/nextjs warns that the legacy client config file "will no
 * longer work" there: Next.js only loads this file (instrumentation-client.ts) in the
 * browser, which meant browser errors were never reported until this file existed.
 *
 * DSN is EU-residency (ingest.de.sentry.io), so all data stays in Germany. The DSN is
 * a public identifier, not a secret; it is read from NEXT_PUBLIC_SENTRY_DSN at build
 * time, so it must be set in Vercel for Production before the build runs.
 */
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 10 % of transactions for performance monitoring
  tracesSampleRate: 0.1,

  // Record a session replay for every error, but don't sample regular sessions
  // (session replay can be expensive on bandwidth and storage). Text and inputs are
  // masked by default, which matters for a compliance product.
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.0,
  integrations: [Sentry.replayIntegration()],
})

// Lets Sentry trace client-side navigations in the App Router.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
