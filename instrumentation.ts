/**
 * Next.js instrumentation hook — runs once at server startup.
 * Sentry v8+ uses this file to initialise on both Node.js and Edge runtimes
 * instead of the legacy sentry.server.config.ts / sentry.edge.config.ts files.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}
