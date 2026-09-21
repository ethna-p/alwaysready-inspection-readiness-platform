/**
 * GET /api/cron/review-reminders — the one cron route with deeper coverage
 * beyond the shared auth gate (see cron-routes.spec.ts).
 *
 * This environment has no RESEND_API_KEY, so sendEmail() always returns
 * `{ sent: false, skipped: 'no_api_key' }` here -- the route's own
 * `if (result.sent)` gate means notification_log is never actually written
 * in this environment, so the idempotency mechanism itself (a real,
 * valuable thing to verify) can't be exercised end-to-end from here. What
 * CAN be verified without a real send: the due-date detection logic
 * itself. Every skipped send is pushed onto the response's own `errors`
 * array as `"<kind>: <org>/<entityId> -> <reason>"` -- a due-soon KLOE
 * assigned to a real user and an overdue one each produce a real,
 * findable entry there, while a KLOE that's neither shows up in neither.
 * That's the actual branching logic this route could get wrong (an
 * off-by-one on the 7-day window, or the overdue/due-soon boundary), and
 * it's what this test targets.
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist.
 *
 * Review reminders are opt-in (Issue #31) -- the seeded teammate defaults
 * to opted out, so this test explicitly opts them in first. Its own opt-in
 * gating is covered separately in notification-preferences.spec.ts; this
 * file stays focused on the due-date detection logic it was written for.
 *
 * Also seeds compliance_records explicitly (support/compliance.ts) -- this
 * spec only ever calls request.get(), never page, so it never triggers the
 * app's own lazy seed-on-dashboard-load self-heal the way most specs do
 * incidentally. Running this file (or any other pure-API cron spec) without
 * a page-navigating spec having run first in the same suite invocation
 * silently no-ops every compliance_records UPDATE below otherwise.
 */
import { test, expect } from '@playwright/test'
import { loadTestAccount } from './support/fixtures'
import { getAdminClient } from './support/admin'
import { CRON_SECRET } from './support/cron'
import { ensureComplianceRecordsSeeded } from './support/compliance'
import { must, tidy } from './support/db'

function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

test('review-reminders: detects a due-soon KLOE and an overdue one, leaves a safe one alone', async ({ request }) => {
  test.setTimeout(60_000)
  const account = loadTestAccount()
  const admin = getAdminClient()

  await ensureComplianceRecordsSeeded(admin, account.orgId)

  // Three KLOEs untouched by any other spec's own .range() picks.
  const { data: kloItems, error: kloErr } = await admin
    .from('klo_items')
    .select('id')
    .order('display_order')
    .range(5, 7)
  expect(kloErr).toBeNull()
  const [dueSoonKlo, overdueKlo, safeKlo] = kloItems!

  const rows = [
    { klo_item_id: dueSoonKlo.id, next_review_due: daysFromNow(3) },  // inside the 7-day DUE_SOON window
    { klo_item_id: overdueKlo.id, next_review_due: daysFromNow(-2) }, // already passed
    { klo_item_id: safeKlo.id,    next_review_due: daysFromNow(90) }, // nowhere near due
  ]

  for (const row of rows) {
    const { error } = await admin
      .from('compliance_records')
      .update({ assigned_to: account.teammate.userId, next_review_due: row.next_review_due })
      .eq('organisation_id', account.orgId)
      .eq('klo_item_id', row.klo_item_id)
    expect(error).toBeNull()
  }

  must(await admin.from('users').update({ notify_review_reminders: true }).eq('id', account.teammate.userId), 'cron-review-reminders: update users')

  try {
    const response = await request.get('/api/cron/review-reminders', {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    })
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.ok).toBe(true)

    const errors: string[] = body.errors ?? []
    expect(errors.some(e => e.includes(`KLOE due_soon`) && e.includes(dueSoonKlo.id))).toBe(true)
    expect(errors.some(e => e.includes(`KLOE overdue`) && e.includes(overdueKlo.id))).toBe(true)
    expect(errors.some(e => e.includes(safeKlo.id))).toBe(false)
  } finally {
    tidy(await admin
      .from('compliance_records')
      .update({ assigned_to: null, next_review_due: null })
      .eq('organisation_id', account.orgId)
      .in('klo_item_id', [dueSoonKlo.id, overdueKlo.id, safeKlo.id]), 'cron-review-reminders: update compliance_records')
    tidy(await admin.from('users').update({ notify_review_reminders: false }).eq('id', account.teammate.userId), 'cron-review-reminders: update users')
  }
})
