/**
 * Loud handling for database writes made by e2e specs and the seed script.
 *
 * supabase-js never throws: a failed write resolves with `{ error }`. A bare
 * `await admin.from('users').update(...)` therefore fails silently, and the spec carries on
 * against data that was never changed, which shows up later as a confusing failure or, worse,
 * a pass that proved nothing. `npm run check:silent-writes` fails CI when a write's result is
 * ignored, so every write in a spec or the seed wraps its result in one of these:
 *
 *   must   set-up and assertions-in-waiting: throw, so the spec stops at the write that failed.
 *   tidy   clean-up (finally blocks, afterEach/afterAll): warn loudly but do not throw, so a
 *          failed clean-up neither hides the spec's own result nor aborts the rest of the tidy-up.
 *          A warning here usually means fixture drift; re-seed (`npm run test:e2e:seed`).
 *
 * No imports on purpose: e2e/support/seed.ts is run directly by Node, which needs plain relative
 * `.ts` imports, while the specs import this without an extension.
 */

type WriteResult = { error: { message: string } | null }

export function must(result: WriteResult, context: string): void {
  if (result.error) throw new Error(`[e2e] ${context} failed: ${result.error.message}`)
}

export function tidy(result: WriteResult, context: string): void {
  if (result.error) console.warn(`[e2e] clean-up failed (${context}): ${result.error.message}`)
}
