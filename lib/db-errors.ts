/**
 * Helpers for database writes whose result would otherwise be thrown away.
 *
 * Supabase queries do not throw: they resolve with `{ error }`. A write written as a bare
 * `await supabase.from(...).update(...)` therefore fails silently, and the caller carries on
 * as if it worked. The 2026-09-21 audit found dozens of these. Every write must now do one
 * of two things with its result:
 *
 *   throwOnDbError  the write matters to the caller: stop, and let the error page / the
 *                   route's 500 path report it (Sentry picks it up).
 *   reportDbError   the write is best-effort (cleanup, a tidy-up after the main work already
 *                   succeeded): carry on, but log it and send it to Sentry, never silence it.
 *
 * `npm run check:silent-writes` fails CI if a write's result is discarded again.
 */

import * as Sentry from '@sentry/nextjs'

type DbError = { message: string; code?: string } | null | undefined

export function throwOnDbError(error: DbError, context: string): void {
  if (!error) return
  console.error(`[${context}] database write failed:`, error)
  throw new Error(`${context}: ${error.message}`)
}

/** Returns true when there was an error (so a caller can branch), after reporting it. */
export function reportDbError(error: DbError, context: string): boolean {
  if (!error) return false
  console.error(`[${context}] database write failed:`, error)
  Sentry.captureException(new Error(`${context}: ${error.message}`), { extra: { code: error.code } })
  return true
}
