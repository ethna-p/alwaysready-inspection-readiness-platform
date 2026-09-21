/**
 * GET /api/cron/onboarding-emails
 *
 * Nightly cron (09:00 UTC) that sends the post-subscription weekly
 * onboarding email sequence to active subscribers.
 *
 * Logic:
 *   - Finds all active, non-demo orgs where subscribed_at is set
 *   - Calculates days elapsed since subscribed_at
 *   - Sends the matching week email when the threshold is first reached
 *   - Deduplication via notification_log (prevents re-sends on retries)
 *
 * Week thresholds:
 *   week_01 → days_elapsed >= 1   (day after subscribing: welcome email)
 *   week_02 → days_elapsed >= 7
 *   week_03 → days_elapsed >= 14
 *   week_04 → days_elapsed >= 21
 *   week_05 → days_elapsed >= 28
 *   week_06 → days_elapsed >= 35
 *   week_07 → days_elapsed >= 42
 *   week_08 → days_elapsed >= 49
 *   week_09 → days_elapsed >= 56
 *   week_10 → days_elapsed >= 63
 *   week_11 → days_elapsed >= 70
 *   week_12 → days_elapsed >= 77
 *
 * Monthly check-ins (post-sequence):
 *   week_16 → days_elapsed >= 112  (~4 months)
 *   week_20 → days_elapsed >= 140  (~5 months)
 *   week_25 → days_elapsed >= 175  (~6 months, six-month check-in)
 *   week_30 → days_elapsed >= 210  (~7 months)
 *   week_38 → days_elapsed >= 266  (~9 months)
 *   week_52 → days_elapsed >= 365  (~12 months, annual)
 *
 * Email definitions live in lib/onboarding-emails.ts.
 *
 * Security: requests must include Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/utils/cron'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { getFirstName } from '@/lib/utils/name'
import { escapeHtml } from '@/lib/utils/escape'
import { ONBOARDING_EMAILS, buildHtml } from '@/lib/onboarding-emails'
import { renderTemplate } from '@/lib/email-templates'
import { sendOnce } from '@/lib/notification-log'
import { withHeartbeat } from '@/lib/cron-health'

// ── Route handler ──────────────────────────────────────────────────────────────

async function handler(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Fetch all active, non-demo orgs with a subscription date set
  const { data: orgs, error: orgsError } = await supabase
    .from('organisations')
    .select('id, subscribed_at')
    .eq('subscription_tier', 'active')
    .not('subscribed_at', 'is', null)

  if (orgsError) {
    console.error('[onboarding-emails] orgs query error:', orgsError.message)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  const now = new Date()
  let totalSent = 0
  let totalSkipped = 0

  for (const org of orgs ?? []) {
    const subscribedAt   = new Date(org.subscribed_at as string)
    const msElapsed      = now.getTime() - subscribedAt.getTime()
    const daysElapsed    = Math.floor(msElapsed / (1000 * 60 * 60 * 24))
    const anchorDate     = subscribedAt.toISOString().slice(0, 10)

    // Iterate emails in threshold order; send every email whose threshold is first
    // met today. Deduplication via notification_log prevents re-sends on retries
    // or catch-up runs.

    // Fetch all existing onboarding log entries for this org
    const { data: existingLogs } = await supabase
      .from('notification_log')
      .select('entity_id')
      .eq('organisation_id', org.id)
      .eq('notification_type', 'onboarding_week')
      .eq('entity_type', 'onboarding')

    const sentWeekIds = new Set((existingLogs ?? []).map((r: { entity_id: string }) => r.entity_id))

    // Fetch admins for this org: exclude anyone who has opted out of marketing emails
    const { data: admins } = await supabase
      .from('users')
      .select('id, email, full_name, marketing_opt_out')
      .eq('organisation_id', org.id)
      .eq('role', 'admin')
      .eq('marketing_opt_out', false)

    if (!admins?.length) continue

    for (const email of ONBOARDING_EMAILS) {
      if (daysElapsed < email.threshold) break  // threshold not yet reached
      if (sentWeekIds.has(email.weekId))   continue  // already sent

      for (const admin of admins) {
        if (!admin.email) continue
        const firstName = escapeHtml(getFirstName(admin.full_name))

        const bodyInner = await renderTemplate(`onboarding_${email.weekId}`, { firstName }, email.body(firstName))

        // Claim, send, release on failure: a redelivered or overlapping run cannot double-send.
        const result = await sendOnce(
          supabase,
          {
            organisationId:   org.id,
            notificationType: 'onboarding_week',
            entityType:       'onboarding',
            entityId:         email.weekId,
            dueDate:          anchorDate,  // deduplication anchor is the subscribed_at date
            recipientEmail:   admin.email,
          },
          'onboarding-emails',
          () => sendEmail({
            to:       admin.email!,
            subject:  email.subject,
            type:     'marketing',
            userId:   admin.id,
            bodyHtml: buildHtml(bodyInner),
          })
        )

        if (result.status === 'sent') {
          totalSent++
        } else {
          if (result.status === 'failed') {
            console.warn(`[onboarding-emails] skipped ${email.weekId} → ${admin.email}: ${result.error}`)
          }
          totalSkipped++
        }
      }
    }
  }

  console.log(`[onboarding-emails] sent=${totalSent} skipped=${totalSkipped}`)
  return NextResponse.json({ sent: totalSent, skipped: totalSkipped }, { status: 200 })
}

export const GET = withHeartbeat('onboarding-emails', handler, createAdminClient)
