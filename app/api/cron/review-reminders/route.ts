/**
 * GET /api/cron/review-reminders
 *
 * Nightly cron (08:00 UTC daily) that scans all active organisations and
 * sends review-reminder emails for:
 *
 *   KLOEs       : to the assigned user when their KLOE is due in 1-7 days
 *                 or has gone overdue (one email per event per due-date cycle)
 *
 *   HR fields   : DBS, supervision, appraisal, and training records,
 *                 to all admins of the org (one email per event per due-date cycle)
 *
 * Protected by CRON_SECRET (Vercel sends this automatically for registered crons).
 * Uses the Supabase admin client (service role) to bypass RLS for reads/writes.
 *
 * Idempotent: each reminder claims its notification_log row (unique index) before it
 * is sent, so a cron delivered twice for the same day cannot double-send.
 */
import 'server-only'
import { NextResponse }    from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail, type SendEmailResult } from '@/lib/email'
import { sendOnce }          from '@/lib/notification-log'
import { escapeHtml }        from '@/lib/utils/escape'
import { renderTemplate }    from '@/lib/email-templates'

// ── Constants ─────────────────────────────────────────────────────────────────

import { PLATFORM_URL } from '@/lib/config'
import { verifyCronSecret } from '@/lib/utils/cron'

const DUE_SOON_DAYS = 7

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysUntil(dateStr: string, today: Date): number {
  const due = new Date(dateStr)
  due.setHours(0, 0, 0, 0)
  const t   = new Date(today)
  t.setHours(0, 0, 0, 0)
  return Math.floor((due.getTime() - t.getTime()) / (1000 * 60 * 60 * 24))
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

// ── Email templates ───────────────────────────────────────────────────────────

function kloeDueSoonHtml(kloeTitle: string, dueDate: string, daysLeft: number): string {
  return `
    <h1 style="margin:0 0 20px;font-size:24px;font-weight:700;color:#111111;line-height:1.3">KLOE review due soon</h1>
    <p style="margin:0 0 16px">
      This is a reminder that your KLOE review is due in <strong>${daysLeft} day${daysLeft === 1 ? '' : 's'}</strong>.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 24px">
      <tr>
        <td style="padding:12px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px">
          <p style="margin:0 0 4px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em">KLOE</p>
          <p style="margin:0;font-weight:600;color:#1a1a1a">${kloeTitle}</p>
          <p style="margin:4px 0 0;font-size:13px;color:#4b5563">Due: ${formatDate(dueDate)}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 24px">
      Please log in to the AlwaysReady platform and complete your review before the due date.
    </p>
    <p style="margin:0 0 24px">
      <a href="${PLATFORM_URL}/dashboard/kloes" style="display:inline-block;background:#014D4E;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px">
        Go to KLOE tracker →
      </a>
    </p>
    <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
      If you've already completed this review, you can ignore this message.
    </p>
  `
}

function kloeOverdueHtml(kloeTitle: string, dueDate: string): string {
  return `
    <h1 style="margin:0 0 20px;font-size:24px;font-weight:700;color:#111111;line-height:1.3">Overdue KLOE review</h1>
    <p style="margin:0 0 16px">
      A KLOE review assigned to you is now <strong style="color:#dc2626">overdue</strong>.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 24px">
      <tr>
        <td style="padding:12px 16px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px">
          <p style="margin:0 0 4px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em">KLOE</p>
          <p style="margin:0;font-weight:600;color:#1a1a1a">${kloeTitle}</p>
          <p style="margin:4px 0 0;font-size:13px;color:#dc2626">Was due: ${formatDate(dueDate)}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 24px">
      Please log in and complete this review as soon as possible to keep your compliance record up to date.
    </p>
    <p style="margin:0 0 24px">
      <a href="${PLATFORM_URL}/dashboard/kloes" style="display:inline-block;background:#014D4E;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px">
        Go to KLOE tracker →
      </a>
    </p>
    <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
      If you have any questions, reply to this email or contact us at
      <a href="mailto:support@alwaysready.uk" style="color:#014D4E">support@alwaysready.uk</a>.
    </p>
  `
}

function hrDueSoonHtml(staffNameRaw: string, fieldLabelRaw: string, dueDate: string, daysLeft: number): string {
  // staffName is a team member's name and fieldLabel can be an
  // admin-defined training type name, both user-supplied, shown to a
  // different person (the recipient admin), not self-directed like most
  // other email templates in this codebase.
  const staffName  = escapeHtml(staffNameRaw)
  const fieldLabel = escapeHtml(fieldLabelRaw)
  return `
    <h1 style="margin:0 0 20px;font-size:24px;font-weight:700;color:#111111;line-height:1.3">HR record due soon</h1>
    <p style="margin:0 0 16px">
      <strong>${staffName}</strong>'s <strong>${fieldLabel}</strong> is due in <strong>${daysLeft} day${daysLeft === 1 ? '' : 's'}</strong>.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 24px">
      <tr>
        <td style="padding:12px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px">
          <p style="margin:0 0 4px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em">Staff member</p>
          <p style="margin:0;font-weight:600;color:#1a1a1a">${staffName}</p>
          <p style="margin:4px 0 0;font-size:13px;color:#4b5563">${fieldLabel}: due ${formatDate(dueDate)}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 24px">
      Please log in to the AlwaysReady HR module to review and update this record.
    </p>
    <p style="margin:0 0 24px">
      <a href="${PLATFORM_URL}/dashboard/hr" style="display:inline-block;background:#014D4E;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px">
        Go to HR module →
      </a>
    </p>
  `
}

function hrOverdueHtml(staffNameRaw: string, fieldLabelRaw: string, dueDate: string): string {
  const staffName  = escapeHtml(staffNameRaw)
  const fieldLabel = escapeHtml(fieldLabelRaw)
  return `
    <h1 style="margin:0 0 20px;font-size:24px;font-weight:700;color:#111111;line-height:1.3">HR record overdue</h1>
    <p style="margin:0 0 16px">
      An HR review is now <strong style="color:#dc2626">overdue</strong>.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 24px">
      <tr>
        <td style="padding:12px 16px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px">
          <p style="margin:0 0 4px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em">Staff member</p>
          <p style="margin:0;font-weight:600;color:#1a1a1a">${staffName}</p>
          <p style="margin:4px 0 0;font-size:13px;color:#dc2626">${fieldLabel}: was due ${formatDate(dueDate)}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 24px">
      Please log in to the AlwaysReady HR module and update this record as soon as possible.
    </p>
    <p style="margin:0 0 24px">
      <a href="${PLATFORM_URL}/dashboard/hr" style="display:inline-block;background:#014D4E;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px">
        Go to HR module →
      </a>
    </p>
    <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
      If you have any questions, reply to this email or contact us at
      <a href="mailto:support@alwaysready.uk" style="color:#014D4E">support@alwaysready.uk</a>.
    </p>
  `
}

// ── Cron handler ──────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  // Verify cron secret
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const today    = new Date()
  today.setHours(0, 0, 0, 0)

  let emailsSent    = 0
  let emailsSkipped = 0
  const errors: string[] = []

  // ── Helper: claim, send, release on failure ──────────────────────────────
  // Claiming before sending (rather than checking, sending, then logging) means a
  // redelivered or overlapping run cannot send the same reminder twice. See sendOnce().

  type EntityType = 'kloe' | 'hr_dbs' | 'hr_supervision' | 'hr_appraisal' | 'hr_training'

  async function deliver(
    organisationId: string,
    notificationType: 'due_soon' | 'overdue',
    entityType: EntityType,
    entityId: string,
    dueDate: string,
    recipientEmail: string,
    errorLabel: string,
    send: () => Promise<SendEmailResult>,
  ): Promise<void> {
    const result = await sendOnce(
      supabase,
      { organisationId, notificationType, entityType, entityId, dueDate, recipientEmail },
      'review-reminders',
      send,
    )
    if (result.status === 'sent') emailsSent++
    else if (result.status === 'already_sent' || result.status === 'opted_out') emailsSkipped++
    else errors.push(`${errorLabel} → ${result.error}`)
  }

  // ── Fetch all active organisations ────────────────────────────────────────

  const { data: orgs, error: orgsError } = await supabase
    .from('organisations')
    .select('id, name')
    .in('subscription_tier', ['trial', 'active'])

  if (orgsError || !orgs) {
    console.error('[review-reminders] Failed to fetch orgs:', orgsError)
    return NextResponse.json({ error: 'Failed to fetch organisations' }, { status: 500 })
  }

  for (const org of orgs) {

    // ── Fetch org admins ────────────────────────────────────────────────────
    // Opt-in only (Issue #31): an admin who hasn't turned review reminders on
    // gets none, regardless of what's due.
    const { data: admins } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('organisation_id', org.id)
      .eq('role', 'admin')
      .eq('notify_review_reminders', true)

    const adminEmails = (admins ?? []).map(a => a.email).filter(Boolean) as string[]

    // ── KLOE notifications ──────────────────────────────────────────────────

    // Fetch all compliance records with an assigned user and a due date
    const { data: records } = await supabase
      .from('compliance_records')
      .select('klo_item_id, next_review_due, assigned_to')
      .eq('organisation_id', org.id)
      .not('assigned_to', 'is', null)
      .not('next_review_due', 'is', null)

    if (records && records.length > 0) {
      // Get klo titles
      const kloIds = records.map(r => r.klo_item_id)
      const { data: kloItems } = await supabase
        .from('klo_items')
        .select('id, title')
        .in('id', kloIds)

      const kloTitleById = new Map((kloItems ?? []).map(k => [k.id, k.title]))

      // Get assigned user emails -- opt-in only (Issue #31), same as admins
      // above: the assignee may be any role, and it's their own preference
      // that gates their own reminder, not their role.
      const assignedUserIds = [...new Set(records.map(r => r.assigned_to!))]
      const { data: assignedUsers } = await supabase
        .from('users')
        .select('id, email, full_name')
        .in('id', assignedUserIds)
        .eq('notify_review_reminders', true)

      const userById = new Map((assignedUsers ?? []).map(u => [u.id, u]))

      for (const record of records) {
        if (!record.next_review_due || !record.assigned_to) continue

        const days         = daysUntil(record.next_review_due, today)
        const kloeTitle    = kloTitleById.get(record.klo_item_id) ?? 'KLOE review'
        const assignedUser = userById.get(record.assigned_to)
        if (!assignedUser?.email) continue

        const recipientEmail = assignedUser.email
        const dueDateStr     = record.next_review_due.split('T')[0] // date only

        if (days >= 1 && days <= DUE_SOON_DAYS) {
          // Due soon
          await deliver(org.id, 'due_soon', 'kloe', record.klo_item_id, dueDateStr, recipientEmail, `KLOE due_soon: ${org.id}/${record.klo_item_id}`, async () => sendEmail({
            to:       recipientEmail,
            subject:  `KLOE review due in ${days} day${days === 1 ? '' : 's'}: ${kloeTitle}`,
            bodyHtml: await renderTemplate(
              'kloe_review_due_soon',
              { kloeTitle, dueDate: formatDate(record.next_review_due), daysLeft: String(days) },
              kloeDueSoonHtml(kloeTitle, record.next_review_due, days),
            ),
            type:     'transactional',
          }))

        } else if (days < 0) {
          // Overdue
          await deliver(org.id, 'overdue', 'kloe', record.klo_item_id, dueDateStr, recipientEmail, `KLOE overdue: ${org.id}/${record.klo_item_id}`, async () => sendEmail({
            to:       recipientEmail,
            subject:  `Overdue KLOE review: ${kloeTitle}`,
            bodyHtml: await renderTemplate(
              'kloe_review_overdue',
              { kloeTitle, dueDate: formatDate(record.next_review_due) },
              kloeOverdueHtml(kloeTitle, record.next_review_due),
            ),
            type:     'transactional',
          }))
        }
      }
    }

    // ── HR notifications (to admins) ────────────────────────────────────────

    if (adminEmails.length === 0) continue

    // Fetch all staff profiles for this org
    const { data: profiles } = await supabase
      .from('hr_staff_profiles')
      .select('user_id, dbs_next_review_due, supervision_next_due, appraisal_next_due')
      .eq('organisation_id', org.id)

    // Fetch staff user details separately
    const staffUserIds = (profiles ?? []).map(p => p.user_id)
    const staffUsersMap = new Map<string, { full_name: string | null; email: string | null }>()
    if (staffUserIds.length > 0) {
      const { data: staffUsers } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', staffUserIds)
      for (const u of staffUsers ?? []) staffUsersMap.set(u.id, u)
    }

    type HrField = {
      entityType: 'hr_dbs' | 'hr_supervision' | 'hr_appraisal'
      label: string
      dueDate: string | null
    }

    for (const profile of profiles ?? []) {
      const staffUser = staffUsersMap.get(profile.user_id) ?? null
      const staffName = staffUser?.full_name ?? staffUser?.email ?? 'Staff member'
      const entityId  = profile.user_id

      const fields: HrField[] = [
        { entityType: 'hr_dbs',         label: 'DBS check',   dueDate: profile.dbs_next_review_due },
        { entityType: 'hr_supervision',  label: 'Supervision', dueDate: profile.supervision_next_due },
        { entityType: 'hr_appraisal',    label: 'Appraisal',   dueDate: profile.appraisal_next_due },
      ]

      for (const field of fields) {
        if (!field.dueDate) continue

        // Copied to a const so the narrowing to string survives inside the send closures below.
        const fieldDueDate = field.dueDate
        const days       = daysUntil(fieldDueDate, today)
        const dueDateStr = fieldDueDate.split('T')[0]

        for (const adminEmail of adminEmails) {
          if (days >= 1 && days <= DUE_SOON_DAYS) {
            await deliver(org.id, 'due_soon', field.entityType, entityId, dueDateStr, adminEmail, `HR due_soon ${field.entityType}: ${org.id}/${entityId}`, async () => sendEmail({
              to:       adminEmail,
              subject:  `${staffName}: ${field.label} due in ${days} day${days === 1 ? '' : 's'}`,
              bodyHtml: await renderTemplate(
                'hr_field_due_soon',
                { staffName: escapeHtml(staffName), fieldLabel: escapeHtml(field.label), dueDate: formatDate(fieldDueDate), daysLeft: String(days) },
                hrDueSoonHtml(staffName, field.label, fieldDueDate, days),
              ),
              type:     'transactional',
            }))

          } else if (days < 0) {
            await deliver(org.id, 'overdue', field.entityType, entityId, dueDateStr, adminEmail, `HR overdue ${field.entityType}: ${org.id}/${entityId}`, async () => sendEmail({
              to:       adminEmail,
              subject:  `${staffName}: ${field.label} is overdue`,
              bodyHtml: await renderTemplate(
                'hr_field_overdue',
                { staffName: escapeHtml(staffName), fieldLabel: escapeHtml(field.label), dueDate: formatDate(fieldDueDate) },
                hrOverdueHtml(staffName, field.label, fieldDueDate),
              ),
              type:     'transactional',
            }))
          }
        }
      }
    }

    // ── HR training records ─────────────────────────────────────────────────

    const { data: trainingRecords } = await supabase
      .from('hr_training_records')
      .select('id, next_due, user_id, training_type_id')
      .eq('organisation_id', org.id)
      .not('next_due', 'is', null)

    // Fetch training type names separately
    const trainingTypeIds = [...new Set((trainingRecords ?? []).map(r => r.training_type_id))]
    const trainingTypeMap = new Map<string, string>()
    if (trainingTypeIds.length > 0) {
      const { data: types } = await supabase
        .from('hr_training_types')
        .select('id, name')
        .in('id', trainingTypeIds)
      for (const t of types ?? []) trainingTypeMap.set(t.id, t.name)
    }

    // Fetch training staff users (may overlap with profile staff)
    const trainingUserIds = [...new Set((trainingRecords ?? []).map(r => r.user_id))]
    const trainingUsersMap = new Map<string, { full_name: string | null; email: string | null }>()
    if (trainingUserIds.length > 0) {
      const { data: tUsers } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', trainingUserIds)
      for (const u of tUsers ?? []) trainingUsersMap.set(u.id, u)
    }

    for (const rec of trainingRecords ?? []) {
      if (!rec.next_due) continue

      const staffUser = trainingUsersMap.get(rec.user_id) ?? null
      const staffName = staffUser?.full_name ?? staffUser?.email ?? 'Staff member'
      const label     = trainingTypeMap.get(rec.training_type_id) ?? 'Training'
      const dueDateStr   = rec.next_due.split('T')[0]
      const days         = daysUntil(rec.next_due, today)

      for (const adminEmail of adminEmails) {
        if (days >= 1 && days <= DUE_SOON_DAYS) {
          await deliver(org.id, 'due_soon', 'hr_training', rec.id, dueDateStr, adminEmail, `HR training due_soon: ${org.id}/${rec.id}`, async () => sendEmail({
            to:       adminEmail,
            subject:  `${staffName}: ${label} due in ${days} day${days === 1 ? '' : 's'}`,
            bodyHtml: hrDueSoonHtml(staffName, label, rec.next_due, days),
            type:     'transactional',
          }))

        } else if (days < 0) {
          await deliver(org.id, 'overdue', 'hr_training', rec.id, dueDateStr, adminEmail, `HR training overdue: ${org.id}/${rec.id}`, async () => sendEmail({
            to:       adminEmail,
            subject:  `${staffName}: ${label} is overdue`,
            bodyHtml: hrOverdueHtml(staffName, label, rec.next_due),
            type:     'transactional',
          }))
        }
      }
    }

  } // end org loop

  console.log(`[review-reminders] sent=${emailsSent} skipped=${emailsSkipped} errors=${errors.length}`)
  if (errors.length > 0) console.error('[review-reminders] errors:', errors)

  return NextResponse.json({
    ok:      true,
    sent:    emailsSent,
    skipped: emailsSkipped,
    errors:  errors.length > 0 ? errors : undefined,
  })
}
