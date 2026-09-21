/**
 * GET /api/cron/notification-reconfirmation
 *
 * Weekly cron (Monday 09:00 UTC) implementing Issue #31's re-confirmation
 * requirement: anyone with at least one opt-in notification enabled gets
 * asked, every 4-6 weeks, whether they still want it.
 *
 * There's no separate "last reminded" log for this -- notification_prefs_
 * confirmed_at (set both when the user visits/saves Account -> Notifications
 * AND when this cron emails them) does double duty as the throttle: sending
 * the re-confirmation email counts as touching the check-in clock the same
 * way an explicit save would, so the next email is naturally ~5 weeks out
 * either way. See app/dashboard/account/notifications/actions.ts's own
 * comment on this field.
 *
 * Protected by CRON_SECRET. Uses the admin client to bypass RLS.
 */
import 'server-only'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { renderTemplate } from '@/lib/email-templates'
import { PLATFORM_URL } from '@/lib/config'
import { verifyCronSecret } from '@/lib/utils/cron'

const RECONFIRM_AFTER_DAYS = 35 // midpoint of the 4-6 week window

function reconfirmationHtml(notificationsList: string): string {
  return `
    <h1 style="margin:0 0 20px;font-size:24px;font-weight:700;color:#111111;line-height:1.3">Still want these AlwaysReady notifications?</h1>
    <p style="margin:0 0 16px">
      You're currently receiving these AlwaysReady email notifications:
    </p>
    <ul style="margin:0 0 24px;padding-left:20px">
      ${notificationsList}
    </ul>
    <p style="margin:0 0 24px">
      Still want these? You can turn any of them off, or back on, from your account settings.
    </p>
    <p style="margin:0 0 24px">
      <a href="${PLATFORM_URL}/dashboard/account?tab=notifications" style="display:inline-block;background:#014D4E;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px">
        Manage notification preferences →
      </a>
    </p>
    <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
      While you're there, we'd appreciate a quick word on how useful they've been. There's a short optional
      feedback box on the same page.
    </p>
  `
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - RECONFIRM_AFTER_DAYS)
  const cutoffIso = cutoff.toISOString()

  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, notify_review_reminders, notify_governance_digest, notification_prefs_confirmed_at')
    .or('notify_review_reminders.eq.true,notify_governance_digest.eq.true')
    .or(`notification_prefs_confirmed_at.is.null,notification_prefs_confirmed_at.lt.${cutoffIso}`)

  if (error) {
    console.error('[notification-reconfirmation] Failed to fetch users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }

  let emailsSent = 0
  const errors: string[] = []

  for (const user of users ?? []) {
    if (!user.email) continue

    const items: string[] = []
    if (user.notify_review_reminders) items.push('KLOE &amp; HR review reminders')
    if (user.notify_governance_digest) items.push('Weekly governance digest')
    const notificationsList = items.map(i => `<li style="margin:0 0 4px">${i}</li>`).join('')

    // Claim this user by stamping their confirmation time first, but only if they are still
    // due (compare-and-set). A redelivered or overlapping run finds no row to stamp and skips
    // them, so nobody is emailed twice. If the send then fails, the old value is put back.
    const { data: claimed, error: claimError } = await supabase
      .from('users')
      .update({ notification_prefs_confirmed_at: new Date().toISOString() })
      .eq('id', user.id)
      .or(`notification_prefs_confirmed_at.is.null,notification_prefs_confirmed_at.lt.${cutoffIso}`)
      .select('id')
    if (claimError) {
      errors.push(`${user.id} → could not claim: ${claimError.message}`)
      continue
    }
    if (!claimed || claimed.length === 0) continue

    let result: Awaited<ReturnType<typeof sendEmail>>
    try {
      result = await sendEmail({
        to:       user.email,
        subject:  'Still want these AlwaysReady notifications?',
        bodyHtml: await renderTemplate('notification_reconfirmation', { notificationsList }, reconfirmationHtml(notificationsList)),
        type:     'transactional',
      })
    } catch (err) {
      result = { sent: false, error: err instanceof Error ? err.message : String(err) }
    }

    if (result.sent) {
      emailsSent++
    } else {
      const { error: restoreError } = await supabase
        .from('users')
        .update({ notification_prefs_confirmed_at: user.notification_prefs_confirmed_at })
        .eq('id', user.id)
      if (restoreError) console.error(`[notification-reconfirmation] could not restore ${user.id}:`, restoreError)
      errors.push(`${user.id} → ${result.error ?? result.skipped}`)
    }
  }

  console.log(`[notification-reconfirmation] sent=${emailsSent} errors=${errors.length}`)
  if (errors.length > 0) console.error('[notification-reconfirmation] errors:', errors)

  return NextResponse.json({
    ok:     true,
    sent:   emailsSent,
    errors: errors.length > 0 ? errors : undefined,
  })
}
