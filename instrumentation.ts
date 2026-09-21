import * as Sentry from '@sentry/nextjs'

/**
 * Next.js instrumentation hook — runs once at server startup.
 * Sentry v8+ uses this file to initialise on both Node.js and Edge runtimes
 * instead of the legacy sentry.server.config.ts / sentry.edge.config.ts files.
 * (The browser side lives in instrumentation-client.ts.)
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

// Reports errors thrown while rendering server components and in route handlers, which
// Next.js otherwise handles itself without telling Sentry. Without this export, server-side
// render errors were only reported if some code caught and forwarded them by hand.
export const onRequestError = Sentry.captureRequestError
