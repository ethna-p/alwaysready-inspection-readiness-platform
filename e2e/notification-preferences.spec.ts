/**
 * Opt-in notification preferences (Issue #31): the toggle UI on
 * Account -> Notifications, the two gated crons (review-reminders,
 * governance-digest), the re-confirmation cron, and the feedback poll +
 * its superadmin view.
 *
 * This environment has no RESEND_API_KEY, so sendEmail() always returns
 * `{ sent: false }` -- the same constraint cron-review-reminders.spec.ts
 * documents. The observable signal for "did this route even attempt a
 * send" is the response's own `errors` array: an entry for a recipient
 * means the route's query included them (opted in); no entry means the
 * opt-in filter excluded them before any send was attempted.
 *
 * Requires the seeded fixture from `npm run test:e2e:seed` to exist.
 */
import { test, expect } from '@playwright/test'
import { login } from './support/actions'
import { loadTestAccount } from './support/fixtures'
import { getAdminClient } from './support/admin'
import { CRON_SECRET } from './support/cron'
import { ensureComplianceRecordsSeeded } from './support/compliance'

function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

test('Account -> Notifications: toggling preferences persists server-side', async ({ page }) => {
  test.setTimeout(60_000)
  const account = loadTestAccount()
  const admin = getAdminClient()

  await admin.from('users').update({
    notify_review_reminders: false,
    notify_governance_digest: false,
    notification_prefs_confirmed_at: null,
  }).eq('id', account.userId)

  try {
    await login(page, account)
    await page.waitForURL('**/dashboard')
    await page.goto('/dashboard/account?tab=notifications')

    await expect(page.getByRole('heading', { name: 'Email notifications' })).toBeVisible()
    const reviewCheckbox = page.locator('input[name="notify_review_reminders"]')
    const digestCheckbox = page.locator('input[name="notify_governance_digest"]')
    await expect(reviewCheckbox).not.toBeChecked()
    await expect(digestCheckbox).not.toBeChecked()

    await reviewCheckbox.check()
    await page.getByRole('button', { name: 'Save preferences' }).click()
    await expect(page.getByText('Saved.')).toBeVisible()

    const { data: afterSave } = await admin
      .from('users')
      .select('notify_review_reminders, notify_governance_digest, notification_prefs_confirmed_at')
      .eq('id', account.userId)
      .single()
    expect(afterSave!.notify_review_reminders).toBe(true)
    expect(afterSave!.notify_governance_digest).toBe(false)
    expect(afterSave!.notification_prefs_confirmed_at).not.toBeNull()

    // Reload and confirm the checked state survives a real page load, not
    // just optimistic client state.
    await page.reload()
    await expect(page.locator('input[name="notify_review_reminders"]')).toBeChecked()
  } finally {
    await admin.from('users').update({
      notify_review_reminders: false,
      notify_governance_digest: false,
      notification_prefs_confirmed_at: null,
    }).eq('id', account.userId)
  }
})

test('review-reminders cron only emails the assignee when they have opted in', async ({ request }) => {
  test.setTimeout(60_000)
  const account = loadTestAccount()
  const admin = getAdminClient()

  // Self-contained rather than relying on the preceding test in this file
  // having navigated a page first (which triggers the app's own lazy
  // seed-on-dashboard-load) -- see support/compliance.ts's own comment.
  await ensureComplianceRecordsSeeded(admin, account.orgId)

  const { data: kloItems, error: kloErr } = await admin
    .from('klo_items')
    .select('id')
    .order('display_order')
    .range(8, 8)
  expect(kloErr).toBeNull()
  const dueSoonKlo = kloItems![0]

  await admin
    .from('compliance_records')
    .update({ assigned_to: account.teammate.userId, next_review_due: daysFromNow(3) })
    .eq('organisation_id', account.orgId)
    .eq('klo_item_id', dueSoonKlo.id)

  // Clear any log entry a prior run left so idempotency doesn't hide the
  // send attempt this test is checking for.
  await admin
    .from('notification_log')
    .delete()
    .eq('organisation_id', account.orgId)
    .eq('entity_type', 'kloe')
    .eq('entity_id', dueSoonKlo.id)

  try {
    // ── Opted out: no send attempt at all ────────────────────────────────
    await admin.from('users').update({ notify_review_reminders: false }).eq('id', account.teammate.userId)

    const optedOutRes = await request.get('/api/cron/review-reminders', {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    })
    expect(optedOutRes.status()).toBe(200)
    const optedOutBody = await optedOutRes.json()
    const optedOutErrors: string[] = optedOutBody.errors ?? []
    // The error string format is "KLOE due_soon: {orgId}/{kloItemId} → ..."
    // -- it never includes the recipient's email, only the KLOE id (see
    // cron-review-reminders.spec.ts, which asserts the same way).
    expect(optedOutErrors.some(e => e.includes('KLOE due_soon') && e.includes(dueSoonKlo.id))).toBe(false)

    // ── Opted in: a send is attempted (and reported as skipped, since this
    // environment has no RESEND_API_KEY -- that's what lands it in errors) ──
    await admin.from('users').update({ notify_review_reminders: true }).eq('id', account.teammate.userId)

    const optedInRes = await request.get('/api/cron/review-reminders', {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    })
    expect(optedInRes.status()).toBe(200)
    const optedInBody = await optedInRes.json()
    const optedInErrors: string[] = optedInBody.errors ?? []
    expect(optedInErrors.some(e => e.includes('KLOE due_soon') && e.includes(dueSoonKlo.id))).toBe(true)
  } finally {
    await admin
      .from('compliance_records')
      .update({ assigned_to: null, next_review_due: null })
      .eq('organisation_id', account.orgId)
      .eq('klo_item_id', dueSoonKlo.id)
    await admin.from('users').update({ notify_review_reminders: false }).eq('id', account.teammate.userId)
    await admin
      .from('notification_log')
      .delete()
      .eq('organisation_id', account.orgId)
      .eq('entity_type', 'kloe')
      .eq('entity_id', dueSoonKlo.id)
  }
})

test('governance-digest cron only emails admins who have opted in', async ({ request }) => {
  test.setTimeout(60_000)
  const account = loadTestAccount()
  const admin = getAdminClient()

  const today = new Date().toISOString().slice(0, 10)
  await admin
    .from('notification_log')
    .delete()
    .eq('organisation_id', account.orgId)
    .eq('entity_type', 'governance_digest')
    .eq('entity_id', account.orgId)
    .eq('due_date', today)

  try {
    await admin.from('users').update({ notify_governance_digest: false }).eq('id', account.userId)
    const optedOutRes = await request.get('/api/cron/governance-digest', {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    })
    expect(optedOutRes.status()).toBe(200)
    const optedOutErrors: string[] = (await optedOutRes.json()).errors ?? []
    expect(optedOutErrors.some(e => e.includes(account.email))).toBe(false)

    await admin.from('users').update({ notify_governance_digest: true }).eq('id', account.userId)
    const optedInRes = await request.get('/api/cron/governance-digest', {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    })
    expect(optedInRes.status()).toBe(200)
    const optedInErrors: string[] = (await optedInRes.json()).errors ?? []
    expect(optedInErrors.some(e => e.includes(account.email))).toBe(true)
  } finally {
    await admin.from('users').update({ notify_governance_digest: false }).eq('id', account.userId)
    await admin
      .from('notification_log')
      .delete()
      .eq('organisation_id', account.orgId)
      .eq('entity_type', 'governance_digest')
      .eq('entity_id', account.orgId)
      .eq('due_date', today)
  }
})

test('notification-reconfirmation cron only emails opted-in users whose confirmation is stale', async ({ request }) => {
  test.setTimeout(60_000)
  const account = loadTestAccount()
  const admin = getAdminClient()

  const sixWeeksAgo = new Date()
  sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42)

  try {
    // Opted in, freshly confirmed -- should NOT be emailed.
    await admin.from('users').update({
      notify_review_reminders: true,
      notification_prefs_confirmed_at: new Date().toISOString(),
    }).eq('id', account.teammate.userId)

    const freshRes = await request.get('/api/cron/notification-reconfirmation', {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    })
    expect(freshRes.status()).toBe(200)
    const freshErrors: string[] = (await freshRes.json()).errors ?? []
    expect(freshErrors.some(e => e.includes(account.teammate.userId))).toBe(false)

    // Opted in, stale confirmation -- should be emailed (and, since there's
    // no RESEND_API_KEY, land in errors the same way the other crons' skipped
    // sends do).
    await admin.from('users').update({
      notification_prefs_confirmed_at: sixWeeksAgo.toISOString(),
    }).eq('id', account.teammate.userId)

    const staleRes = await request.get('/api/cron/notification-reconfirmation', {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    })
    expect(staleRes.status()).toBe(200)
    const staleErrors: string[] = (await staleRes.json()).errors ?? []
    expect(staleErrors.some(e => e.includes(account.teammate.userId))).toBe(true)
  } finally {
    await admin.from('users').update({
      notify_review_reminders: false,
      notify_governance_digest: false,
      notification_prefs_confirmed_at: null,
    }).eq('id', account.teammate.userId)
  }
})

test('notification feedback: submitting on the Notifications tab shows up in the superadmin view', async ({ page }) => {
  test.setTimeout(60_000)
  const account = loadTestAccount()
  const admin = getAdminClient()

  await admin.from('notification_feedback').delete().eq('user_id', account.userId)

  try {
    await login(page, account)
    await page.waitForURL('**/dashboard')
    await page.goto('/dashboard/account?tab=notifications')

    await page.getByRole('heading', { name: 'How useful are these?' }).waitFor()
    await page.getByText('Very useful', { exact: true }).click()
    await page.getByPlaceholder('Any suggestions? (optional)').fill('E2E feedback suggestion text.')
    await page.getByRole('button', { name: 'Send feedback' }).click()
    await expect(page.getByText('Thanks for the feedback.')).toBeVisible()

    const { data: feedbackRow } = await admin
      .from('notification_feedback')
      .select('usefulness, suggestion')
      .eq('user_id', account.userId)
      .single()
    expect(feedbackRow?.usefulness).toBe('very_useful')
    expect(feedbackRow?.suggestion).toBe('E2E feedback suggestion text.')

    // ── Superadmin view shows it (fresh context -- page is already a
    // logged-in admin session, and /login redirects an authenticated
    // session straight back to /dashboard rather than showing the form) ──
    const superadminContext = await page.context().browser()!.newContext()
    const superadminPage = await superadminContext.newPage()
    await login(superadminPage, {
      email: account.superadmin.email,
      password: account.superadmin.password,
      totpSecret: account.superadmin.totpSecret,
    })
    await superadminPage.waitForURL('**/superadmin/provision')
    await superadminPage.goto('/superadmin/notification-feedback')

    await expect(superadminPage.getByText('E2E feedback suggestion text.')).toBeVisible()
    await superadminContext.close()
  } finally {
    await admin.from('notification_feedback').delete().eq('user_id', account.userId)
  }
})
