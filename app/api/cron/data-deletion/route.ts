/**
 * GET /api/cron/data-deletion
 *
 * Daily cron (03:00 UTC) that permanently deletes any organisation whose
 * data_deletion_due_at has passed. This covers:
 *   - Trials that lapsed without subscribing (set by trial-emails cron)
 *   - Paid subscriptions that were cancelled (set by Stripe webhook)
 *
 * All child rows (users, KLOE records, evidence, HR data, etc.) are removed
 * via ON DELETE CASCADE on their foreign keys to organisations(id).
 *
 * The deletion is intentionally hard — there is no soft-delete. Once run,
 * data is gone. This is required for GDPR compliance.
 *
 * A pre-deletion warning email is sent when data_deletion_due_at is exactly
 * 3 days away (idempotent via notification_log).
 *
 * Protected by CRON_SECRET (sent automatically by Vercel for registered crons).
 */

import 'server-only'
import { NextResponse }      from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail }         from '@/lib/email'
import { getFirstName }  from '@/lib/utils/name'
import { PLATFORM_URL } from '@/lib/config'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const secret     = process.env.CRON_SECRET
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const supabase   = createAdminClient()
  const now        = new Date()
  const todayStr   = now.toISOString().split('T')[0]

  let deleted  = 0
  let warned   = 0
  let skipped  = 0
  const errors: string[] = []

  // ── 3-day warning emails ─────────────────────────────────────────────────────
  // Find orgs whose deletion is due in exactly 3 days and send a final warning.

  const warnFrom = new Date(now)
  warnFrom.setDate(warnFrom.getDate() + 3)
  const warnFrom0 = new Date(warnFrom)
  warnFrom0.setHours(0, 0, 0, 0)
  const warnTo0   = new Date(warnFrom)
  warnTo0.setHours(23, 59, 59, 999)

  const { data: warningOrgs } = await supabase
    .from('organisations')
    .select('id, name')
    .gte('data_deletion_due_at', warnFrom0.toISOString())
    .lte('data_deletion_due_at', warnTo0.toISOString())

  for (const org of warningOrgs ?? []) {
    const { data: admins } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('organisation_id', org.id)
      .eq('role', 'admin')

    for (const admin of admins ?? []) {
      if (!admin.email) continue

      // Idempotency — only send once
      const { data: existing } = await supabase
        .from('notification_log')
        .select('id')
        .eq('organisation_id',   org.id)
        .eq('notification_type', 'data_deletion_warning')
        .eq('entity_type',       'organisation')
        .eq('entity_id',         org.id)
        .eq('recipient_email',   admin.email)
        .maybeSingle()

      if (existing) { skipped++; continue }

      const deletionDate = warnFrom0.toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
      const firstName = getFirstName(admin.full_name)

      const result = await sendEmail({
        to:      admin.email,
        subject: 'Reminder: your AlwaysReady data will be deleted in 3 days',
        type:    'transactional',
        bodyHtml: `
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${firstName},</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
            This is a reminder that the data for <strong>${org.name}</strong> on AlwaysReady
            will be permanently deleted on <strong>${deletionDate}</strong> — in 3 days.
          </p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
            You can download your data now by logging in and using the download buttons
            on the page shown. You can also resubscribe at any time before that date to
            keep your account and all your data.
          </p>
          <p style="margin:0 0 32px">
            <a href="${PLATFORM_URL}/login"
               style="display:inline-block;background-color:#014D4E;color:#ffffff;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:600;text-decoration:none">
              Log in to download or resubscribe &rarr;
            </a>
          </p>
          <p style="margin:0;font-size:13px;line-height:1.6;color:#888">
            If you have any questions, email us at
            <a href="mailto:support@alwaysready.uk" style="color:#014D4E">support@alwaysready.uk</a>.
          </p>
        `,
      })

      if (result.sent) {
        await supabase.from('notification_log').insert({
          organisation_id:   org.id,
          notification_type: 'data_deletion_warning',
          entity_type:       'organisation',
          entity_id:         org.id,
          due_date:          todayStr,
          recipient_email:   admin.email,
        })
        warned++
        console.log(`[data-deletion] 3-day warning sent to ${admin.email} (${org.name})`)
      } else {
        errors.push(`warn → ${admin.email}: ${result.error ?? result.skipped}`)
      }
    }
  }

  // ── Hard deletion ─────────────────────────────────────────────────────────────
  // Delete any organisation where data_deletion_due_at < now().
  // Child rows are removed by ON DELETE CASCADE.

  const { data: dueOrgs } = await supabase
    .from('organisations')
    .select('id, name')
    .not('data_deletion_due_at', 'is', null)
    .lt('data_deletion_due_at', now.toISOString())

  for (const org of dueOrgs ?? []) {
    // Before deleting, get admin emails to send a confirmation
    const { data: admins } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('organisation_id', org.id)
      .eq('role', 'admin')

    const { error: delError } = await supabase
      .from('organisations')
      .delete()
      .eq('id', org.id)

    if (delError) {
      errors.push(`delete ${org.id} (${org.name}): ${delError.message}`)
      console.error(`[data-deletion] Failed to delete org ${org.id}:`, delError.message)
      continue
    }

    deleted++
    console.log(`[data-deletion] Deleted org ${org.id} (${org.name})`)

    // Send deletion confirmation to each admin
    for (const admin of admins ?? []) {
      if (!admin.email) continue
      const firstName = getFirstName(admin.full_name)
      await sendEmail({
        to:      admin.email,
        subject: 'Your AlwaysReady data has been deleted',
        type:    'transactional',
        bodyHtml: `
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${firstName},</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
            As notified, all data associated with <strong>${org.name}</strong> on AlwaysReady
            has now been permanently deleted in accordance with our data retention policy.
          </p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
            If you'd like to start a new account in the future, you're very welcome to do so.
          </p>
          <p style="margin:0;font-size:13px;line-height:1.6;color:#888">
            If you have any questions about this deletion, please contact
            <a href="mailto:support@alwaysready.uk" style="color:#014D4E">support@alwaysready.uk</a>.
          </p>
        `,
      }).catch(err => console.error('[data-deletion] confirmation email failed:', err))
    }
  }

  console.log(`[data-deletion] deleted=${deleted} warned=${warned} skipped=${skipped} errors=${errors.length}`)
  if (errors.length > 0) console.error('[data-deletion] errors:', errors)

  return NextResponse.json({
    ok:      true,
    deleted,
    warned,
    skipped,
    errors:  errors.length > 0 ? errors : undefined,
  })
}
