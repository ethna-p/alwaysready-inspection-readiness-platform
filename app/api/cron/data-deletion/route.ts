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
 * The deletion is intentionally hard: there is no soft-delete. Once run,
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
import { renderTemplate }    from '@/lib/email-templates'
import { getFirstName }  from '@/lib/utils/name'
import { escapeHtml } from '@/lib/utils/escape'
import { PLATFORM_URL } from '@/lib/config'
import { verifyCronSecret } from '@/lib/utils/cron'
import { deleteStoragePrefix } from '@/lib/utils/storage-cleanup'
import { sendOnce } from '@/lib/notification-log'

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
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

  // Defence-in-depth: never warn/delete an active (or past_due, still in a
  // payment retry grace period) org, even if data_deletion_due_at is stale.
  // The real fix is that checkout.session.completed now clears
  // data_deletion_due_at when a subscription activates, but this table is
  // never the only thing standing between a paying customer and permanent
  // deletion for something this destructive.
  const { data: warningOrgs } = await supabase
    .from('organisations')
    .select('id, name')
    .neq('is_tester', true)
    .neq('subscription_tier', 'active')
    .neq('subscription_tier', 'past_due')
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

      // Idempotency: only send once
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
      const firstName = escapeHtml(getFirstName(admin.full_name))

      const defaultDeletionReminderHtml = `
          <h1 style="margin:0 0 20px;font-size:24px;font-weight:700;color:#111111;line-height:1.3">Reminder: your AlwaysReady data will be deleted in 3 days</h1>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
            This is a reminder, ${firstName}, that the data for <strong>${escapeHtml(org.name)}</strong> on AlwaysReady
            will be permanently deleted on <strong>${deletionDate}</strong>, in 3 days.
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
          <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
            If you have any questions, email us at
            <a href="mailto:support@alwaysready.uk" style="color:#014D4E">support@alwaysready.uk</a>.
          </p>
        `

      // Claim, send, release on failure, so a redelivered or overlapping run cannot double-send.
      const result = await sendOnce(
        supabase,
        {
          organisationId:   org.id,
          notificationType: 'data_deletion_warning',
          entityType:       'organisation',
          entityId:         org.id,
          dueDate:          todayStr,
          recipientEmail:   admin.email,
        },
        'data-deletion',
        async () => sendEmail({
          to:      admin.email!,
          subject: 'Reminder: your AlwaysReady data will be deleted in 3 days',
          type:    'transactional',
          bodyHtml: await renderTemplate(
            'data_deletion_reminder',
            { firstName, orgName: escapeHtml(org.name), deletionDate },
            defaultDeletionReminderHtml,
          ),
        })
      )

      if (result.status === 'sent') {
        warned++
        console.log(`[data-deletion] 3-day warning sent to ${admin.email} (${org.name})`)
      } else if (result.status === 'already_sent') {
        skipped++
      } else {
        errors.push(`warn → ${admin.email}: ${result.status === 'failed' ? result.error : result.status}`)
      }
    }
  }

  // ── Hard deletion ─────────────────────────────────────────────────────────────
  // Delete any organisation where data_deletion_due_at < now().
  // Child rows are removed by ON DELETE CASCADE.
  //
  // Defence-in-depth: never delete an active (or past_due) org, see the
  // matching comment on the warning query above. This is the actual
  // destructive step, so this guard matters most here.

  const { data: dueOrgs } = await supabase
    .from('organisations')
    .select('id, name')
    .not('data_deletion_due_at', 'is', null)
    .neq('is_tester', true)
    .neq('subscription_tier', 'active')
    .neq('subscription_tier', 'past_due')
    .lt('data_deletion_due_at', now.toISOString())

  for (const org of dueOrgs ?? []) {
    // Before deleting, get admin emails to send a confirmation
    const { data: admins } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('organisation_id', org.id)
      .eq('role', 'admin')

    // ── Storage cleanup ──────────────────────────────────────────────────────
    // Delete Storage files before the DB row so we have the org ID.
    // Errors are non-fatal: we log them and still proceed with the DB deletion.
    try {
      const evidenceCount = await deleteStoragePrefix(supabase, 'evidence', org.id)
      if (evidenceCount > 0) {
        console.log(`[data-deletion] Removed ${evidenceCount} evidence file(s) for org ${org.id}`)
      }
    } catch (storageErr) {
      console.error(`[data-deletion] Storage evidence cleanup failed for org ${org.id}:`, storageErr)
    }

    try {
      const logoFiles = await supabase.storage.from('org-logos').list(org.id)
      if (logoFiles.data && logoFiles.data.length > 0) {
        const paths = logoFiles.data.map(f => `${org.id}/${f.name}`)
        await supabase.storage.from('org-logos').remove(paths)
        console.log(`[data-deletion] Removed org logo(s) for org ${org.id}`)
      }
    } catch (logoErr) {
      console.error(`[data-deletion] Storage logo cleanup failed for org ${org.id}:`, logoErr)
    }

    // ── Database deletion ────────────────────────────────────────────────────
    const { data: deletedRows, error: delError } = await supabase
      .from('organisations')
      .delete()
      .eq('id', org.id)
      .select('id')

    if (delError) {
      errors.push(`delete ${org.id} (${org.name}): ${delError.message}`)
      console.error(`[data-deletion] Failed to delete org ${org.id}:`, delError.message)
      continue
    }

    // Nothing deleted means an overlapping run already removed this organisation (and sent
    // its confirmation). The organisation's log rows go with it, so this is the only guard
    // against emailing the confirmation twice.
    if (!deletedRows || deletedRows.length === 0) continue

    deleted++
    console.log(`[data-deletion] Deleted org ${org.id} (${org.name})`)

    // Send deletion confirmation to each admin
    for (const admin of admins ?? []) {
      if (!admin.email) continue
      const firstName = escapeHtml(getFirstName(admin.full_name))
      const defaultDeletionCompletedHtml = `
          <h1 style="margin:0 0 20px;font-size:24px;font-weight:700;color:#111111;line-height:1.3">Your AlwaysReady data has been deleted</h1>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
            As notified, ${firstName}, all data associated with <strong>${escapeHtml(org.name)}</strong> on AlwaysReady
            has now been permanently deleted in accordance with our data retention policy.
          </p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
            One exception: our payment processor, Stripe, is legally required to retain certain billing and
            transaction records for a period after your subscription ends, as required under UK tax and
            financial record-keeping law. Stripe holds this independently of AlwaysReady; we do not have
            access to it once your account is deleted, and it is not used for anything beyond Stripe's own
            legal obligations.
          </p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
            If you'd like to start a new account in the future, you're very welcome to do so.
          </p>
          <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
            If you have any questions about this deletion, please contact
            <a href="mailto:support@alwaysready.uk" style="color:#014D4E">support@alwaysready.uk</a>.
          </p>
        `

      await sendEmail({
        to:      admin.email,
        subject: 'Your AlwaysReady data has been deleted',
        type:    'transactional',
        bodyHtml: await renderTemplate('data_deletion_completed', { firstName, orgName: escapeHtml(org.name) }, defaultDeletionCompletedHtml),
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
