/**
 * The seven /api/cron/* routes' shared auth gate (lib/utils/cron.ts's
 * verifyCronSecret -- the same helper every one of them is supposed to
 * call first, per this repo's own Chunk 4 debugging-schedule check).
 *
 * playwright.config.ts's webServer sets a fixed, test-only CRON_SECRET
 * (see e2e/support/cron.ts) specifically so this file can exercise the
 * real "correct secret" path -- CRON_SECRET is unset in .env.local
 * entirely, and verifyCronSecret() rejects every request unconditionally
 * when that's the case, so without this override these routes could only
 * ever be tested hitting their always-401 branch.
 *
 * Confirms each route: rejects with no Authorization header, rejects a
 * wrong bearer token, and returns 200 with the right secret (this
 * environment has no RESEND_API_KEY, so none of these actually send real
 * email -- a 200 here means the route ran its real logic end to end and
 * degraded gracefully, not that it skipped its own body). Business logic
 * specific to each route beyond this shared gate is not otherwise covered
 * here -- see cron-review-reminders.spec.ts for the one route with deeper
 * coverage of its actual due-date detection logic.
 */
import { test, expect } from '@playwright/test'
import { CRON_SECRET } from './support/cron'

const CRON_ROUTES = [
  '/api/cron/data-deletion',
  '/api/cron/governance-digest',
  '/api/cron/onboarding-emails',
  '/api/cron/notification-reconfirmation',
  '/api/cron/review-reminders',
  '/api/cron/trial-emails',
  '/api/cron/waitlist-nurture',
]

for (const route of CRON_ROUTES) {
  test(`${route}: rejects with no/wrong secret, succeeds with the real one`, async ({ request }) => {
    test.setTimeout(60_000)

    const noAuth = await request.get(route)
    expect(noAuth.status()).toBe(401)

    const wrongAuth = await request.get(route, { headers: { Authorization: 'Bearer not-the-real-secret' } })
    expect(wrongAuth.status()).toBe(401)

    const correctAuth = await request.get(route, { headers: { Authorization: `Bearer ${CRON_SECRET}` } })
    expect(correctAuth.status()).toBe(200)
    // Five of the six routes report `{ ok: true, ... }`; onboarding-emails
    // is the one exception, returning `{ sent, skipped }` with no `ok`
    // field at all -- a real, if minor, inconsistency across these routes.
    // Asserting only what's actually common (200 + valid JSON) rather than
    // papering over that with a body shape not every route has.
    const body = await correctAuth.json()
    expect(typeof body).toBe('object')
  })
}
