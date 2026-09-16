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
import { PLATFORM_URL } from '@/lib/config'
import { verifyCronSecret } from '@/lib/utils/cron'

const RECONFIRM_AFTER_DAYS = 35 // midpoint of the 4-6 week window

function reconfirmationHtml(reviewReminders: boolean, governanceDigest: boolean): string {
  const items: string[] = []
  if (reviewReminders) items.push('KLOE &amp; HR review reminders')
  if (governanceDigest) items.push('Weekly governance digest')

  return `
    <p style="margin:0 0 16px">Hi,</p>
    <p style="margin:0 0 16px">
      You're currently receiving these AlwaysReady email notifications:
    </p>
    <ul style="margin:0 0 24px;padding-left:20px">
      ${items.map(i => `<li style="margin:0 0 4px">${i}</li>`).join('')}
    </ul>
    <p style="margin:0 0 24px">
      Still want these? You can turn any of them off — or back on — from your account settings.
    </p>
    <p style="margin:0 0 24px">
      <a href="${PLATFORM_URL}/dashboard/account?tab=notifications" style="display:inline-block;background:#014D4E;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px">
        Manage notification preferences →
      </a>
    </p>
    <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
      While you're there, we'd appreciate a quick word on how useful they've been — there's a short optional
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

    const result = await sendEmail({
      to:       user.email,
      subject:  'Still want these AlwaysReady notifications?',
      bodyHtml: reconfirmationHtml(user.notify_review_reminders, user.notify_governance_digest),
      type:     'transactional',
    })

    if (result.sent) {
      await supabase
        .from('users')
        .update({ notification_prefs_confirmed_at: new Date().toISOString() })
        .eq('id', user.id)
      emailsSent++
    } else {
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
