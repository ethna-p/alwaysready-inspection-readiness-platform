/**
 * GET /api/cron/governance-digest
 *
 * Weekly cron (Monday 08:30 UTC) that emails each org's admin(s) a
 * governance summary covering the items that fall through individual
 * reminders:
 *
 *   • Overall readiness % (compliant KLOEs vs total)
 *   • Overdue KLOEs with no assignee — the existing nightly cron only
 *     emails assigned users, so unassigned overdue KLOEs get no nudge.
 *   • KLOEs never started (grey — no review date ever set)
 *   • Open/under-review incidents
 *   • Overdue action items (no existing reminder covers these)
 *
 * Protected by CRON_SECRET. Uses admin client to bypass RLS.
 * Idempotent via notification_log (entity_type = 'governance_digest',
 * entity_id = org id, due_date = Monday's date string).
 */
import 'server-only'
import { NextResponse }      from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail }         from '@/lib/email'
import { PLATFORM_URL }     from '@/lib/config'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function pct(n: number, d: number) {
  return d === 0 ? 0 : Math.round((n / d) * 100)
}

function ragBadgeHtml(label: string, colour: string): string {
  return `<span style="display:inline-block;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:600;background:${colour};color:#fff">${label}</span>`
}

function digestHtml({
  orgName,
  readinessPct,
  totalKlos,
  compliantKlos,
  overdueUnassigned,
  neverStarted,
  openIncidents,
  overdueActions,
  reportDate,
}: {
  orgName: string
  readinessPct: number
  totalKlos: number
  compliantKlos: number
  overdueUnassigned: number
  neverStarted: number
  openIncidents: number
  overdueActions: number
  reportDate: string
}): string {
  const hasAlerts = overdueUnassigned > 0 || neverStarted > 0 || openIncidents > 0 || overdueActions > 0

  const rows = [
    overdueUnassigned > 0 && `
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb">
          ${ragBadgeHtml('Overdue', '#dc2626')}
        </td>
        <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb">
          <strong>${overdueUnassigned}</strong> overdue KLOE${overdueUnassigned !== 1 ? 's' : ''} with no assignee —
          nobody is receiving individual reminders for these.
        </td>
        <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;white-space:nowrap">
          <a href="${PLATFORM_URL}/dashboard/daily-report" style="color:#014D4E;font-weight:600">View →</a>
        </td>
      </tr>`,
    neverStarted > 0 && `
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb">
          ${ragBadgeHtml('Not started', '#9ca3af')}
        </td>
        <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb">
          <strong>${neverStarted}</strong> KLOE${neverStarted !== 1 ? 's' : ''} have never been started.
        </td>
        <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;white-space:nowrap">
          <a href="${PLATFORM_URL}/dashboard/kloes" style="color:#014D4E;font-weight:600">View →</a>
        </td>
      </tr>`,
    openIncidents > 0 && `
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb">
          ${ragBadgeHtml('Open', '#dc2626')}
        </td>
        <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb">
          <strong>${openIncidents}</strong> incident${openIncidents !== 1 ? 's' : ''} open or under review.
        </td>
        <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;white-space:nowrap">
          <a href="${PLATFORM_URL}/dashboard/incidents" style="color:#014D4E;font-weight:600">View →</a>
        </td>
      </tr>`,
    overdueActions > 0 && `
      <tr>
        <td style="padding:10px 16px">
          ${ragBadgeHtml('Overdue', '#d97706')}
        </td>
        <td style="padding:10px 16px">
          <strong>${overdueActions}</strong> action item${overdueActions !== 1 ? 's' : ''} past their due date.
        </td>
        <td style="padding:10px 16px;white-space:nowrap">
          <a href="${PLATFORM_URL}/dashboard/kloes" style="color:#014D4E;font-weight:600">View →</a>
        </td>
      </tr>`,
  ].filter(Boolean).join('')

  return `
    <p style="margin:0 0 16px">Hi,</p>
    <p style="margin:0 0 16px">
      Here is your weekly governance summary for <strong>${orgName}</strong> — ${reportDate}.
    </p>

    <!-- Readiness score -->
    <table style="width:100%;border-collapse:collapse;margin:0 0 24px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px">
      <tr>
        <td style="padding:16px 20px">
          <p style="margin:0 0 4px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em">Overall readiness</p>
          <p style="margin:0;font-size:32px;font-weight:700;color:#014D4E">${readinessPct}%</p>
          <p style="margin:4px 0 0;font-size:13px;color:#4b5563">${compliantKlos} of ${totalKlos} KLOEs up to date</p>
        </td>
      </tr>
    </table>

    ${hasAlerts ? `
    <!-- Alerts -->
    <p style="margin:0 0 12px;font-weight:600;color:#92400e">Areas needing attention this week:</p>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;margin:0 0 24px;font-size:14px">
      ${rows}
    </table>
    ` : `
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin:0 0 24px">
      <p style="margin:0;color:#166534;font-weight:600">✓ No governance alerts this week.</p>
      <p style="margin:4px 0 0;color:#166534;font-size:13px">All KLOEs are assigned, incidents are closed, and action items are on track.</p>
    </div>
    `}

    <p style="margin:0 0 24px">
      <a href="${PLATFORM_URL}/dashboard" style="display:inline-block;background:#014D4E;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px">
        Go to dashboard →
      </a>
    </p>
    <p style="margin:0;color:#9ca3af;font-size:12px">
      You receive this weekly digest as an administrator of ${orgName} on AlwaysReady.
      Individual KLOE and HR reminders are sent separately on a daily basis.
    </p>
  `
}

// ── Cron handler ──────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const secret     = process.env.CRON_SECRET
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const supabase  = createAdminClient()
  const today     = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr  = today.toISOString().split('T')[0]

  let emailsSent    = 0
  let emailsSkipped = 0
  const errors: string[] = []

  // Fetch all active orgs
  const { data: orgs, error: orgsError } = await supabase
    .from('organisations')
    .select('id, name')
    .in('subscription_tier', ['trial', 'active'])

  if (orgsError || !orgs) {
    return NextResponse.json({ error: 'Failed to fetch organisations' }, { status: 500 })
  }

  for (const org of orgs) {
    // Check idempotency — one digest per org per week (keyed on Monday's date)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: alreadySent } = await supabase
      .from('notification_log')
      .select('id')
      .eq('organisation_id',   org.id)
      .eq('notification_type', 'weekly_digest')
      .eq('entity_type',       'governance_digest')
      .eq('entity_id',         org.id)
      .eq('due_date',          todayStr)
      .maybeSingle()

    if (alreadySent) { emailsSkipped++; continue }

    // Fetch admins
    const { data: admins } = await supabase
      .from('users')
      .select('id, email')
      .eq('organisation_id', org.id)
      .eq('role', 'admin')

    const adminEmails = (admins ?? []).map(a => a.email).filter(Boolean) as string[]
    if (adminEmails.length === 0) continue

    // ── Readiness calculation ─────────────────────────────────────────────
    const { data: kloItems } = await supabase
      .from('klo_items')
      .select('id')

    const { data: records } = await supabase
      .from('compliance_records')
      .select('klo_item_id, status, next_review_due, assigned_to')
      .eq('organisation_id', org.id)

    const recordByKloId = new Map((records ?? []).map(r => [r.klo_item_id, r]))
    const totalKlos     = (kloItems ?? []).length
    let compliantKlos   = 0
    let overdueUnassigned = 0
    let neverStarted    = 0

    for (const k of kloItems ?? []) {
      const rec         = recordByKloId.get(k.id)
      const status      = rec?.status ?? 'not_started'
      const reviewDue   = rec?.next_review_due ? new Date(rec.next_review_due) : null
      const isCompliant = status === 'completed' && reviewDue !== null && reviewDue >= today

      if (isCompliant) compliantKlos++

      // Grey = never started or no record
      if (!rec || status === 'not_started') neverStarted++

      // Red + no assignee = falls through individual cron
      const isOverdue = status === 'completed' && reviewDue !== null && reviewDue < today
      if (isOverdue && !rec?.assigned_to) overdueUnassigned++
    }

    // ── Open incidents ────────────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: openIncidents } = await supabase
      .from('incidents')
      .select('id', { count: 'exact', head: true })
      .eq('organisation_id', org.id)
      .in('status', ['open', 'under_review'])

    // ── Overdue action items ──────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: overdueActions } = await supabase
      .from('action_items')
      .select('id', { count: 'exact', head: true })
      .eq('organisation_id', org.id)
      .in('status', ['open', 'in_progress'])
      .lt('due_date', todayStr)
      .not('due_date', 'is', null)

    const readinessPct = pct(compliantKlos, totalKlos)
    const reportDate   = formatDate(today.toISOString())

    // ── Send to each admin ────────────────────────────────────────────────
    for (const adminEmail of adminEmails) {
      const result = await sendEmail({
        to:       adminEmail,
        subject:  `Weekly governance digest — ${org.name} (${readinessPct}% ready)`,
        bodyHtml: digestHtml({
          orgName:           org.name,
          readinessPct,
          totalKlos,
          compliantKlos,
          overdueUnassigned,
          neverStarted,
          openIncidents:     openIncidents ?? 0,
          overdueActions:    overdueActions ?? 0,
          reportDate,
        }),
        type: 'transactional',
      })

      if (result.sent) {
        emailsSent++
      } else {
        errors.push(`${org.id} → ${adminEmail}: ${result.error ?? result.skipped}`)
      }
    }

    // Log to prevent re-send this week
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from('notification_log').insert({
      organisation_id:   org.id,
      notification_type: 'weekly_digest',
      entity_type:       'governance_digest',
      entity_id:         org.id,
      due_date:          todayStr,
      recipient_email:   adminEmails[0], // primary admin for dedup key
    })
  }

  console.log(`[governance-digest] sent=${emailsSent} skipped=${emailsSkipped} errors=${errors.length}`)

  return NextResponse.json({
    ok:      true,
    sent:    emailsSent,
    skipped: emailsSkipped,
    errors:  errors.length > 0 ? errors : undefined,
  })
}
