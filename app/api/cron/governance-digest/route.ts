/**
 * GET /api/cron/governance-digest
 *
 * Weekly cron (Monday 08:30 UTC) that emails each org's admin(s) a
 * governance summary covering the items that fall through individual
 * reminders:
 *
 *   • Overall readiness % (compliant KLOEs vs total)
 *   • Overdue KLOEs with no assignee: the existing nightly cron only
 *     emails assigned users, so unassigned overdue KLOEs get no nudge.
 *   • KLOEs never started (grey, no review date ever set)
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
import { renderTemplate }    from '@/lib/email-templates'
import { verifyCronSecret } from '@/lib/utils/cron'
import { PLATFORM_URL }     from '@/lib/config'
import { escapeHtml }       from '@/lib/utils/escape'
import { sendOnce }         from '@/lib/notification-log'
import { withHeartbeat } from '@/lib/cron-health'

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
  orgName: orgNameRaw,
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
  const orgName = escapeHtml(orgNameRaw)
  const hasAlerts = overdueUnassigned > 0 || neverStarted > 0 || openIncidents > 0 || overdueActions > 0

  const rows = [
    overdueUnassigned > 0 && `
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb">
          ${ragBadgeHtml('Overdue', '#dc2626')}
        </td>
        <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb">
          <strong>${overdueUnassigned}</strong> overdue KLOE${overdueUnassigned !== 1 ? 's' : ''} with no assignee:
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
    <h1 style="margin:0 0 20px;font-size:24px;font-weight:700;color:#111111;line-height:1.3">Weekly governance digest</h1>
    <p style="margin:0 0 16px">
      Here is your weekly governance summary for <strong>${orgName}</strong>: ${reportDate}.
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

async function handler(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const supabase  = createAdminClient()
  // todayStr must be the UTC calendar date, computed independently of the
  // process's local timezone: today.setHours() zeroes LOCAL midnight, and
  // toISOString() on that then converts back to UTC, which lands on the
  // previous day whenever the local offset is positive (e.g. BST). That
  // shift makes the notification_log idempotency key disagree with what
  // "today" means anywhere reading due_date in UTC (including e2e tests),
  // so a digest already logged under the wrong day looks unsent forever
  // and silently never re-fires until a manual cleanup.
  const todayStr  = new Date().toISOString().split('T')[0]
  const today     = new Date()
  today.setHours(0, 0, 0, 0)

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
    // Idempotency is per admin, claimed just before each send (see sendOnce below): one
    // digest per admin per day. A failed send releases its own claim, so a retry reaches
    // only the admins who did not get it.

    // Fetch admins -- opt-in only (Issue #31): an admin who hasn't turned
    // the digest on gets none.
    const { data: admins } = await supabase
      .from('users')
      .select('id, email')
      .eq('organisation_id', org.id)
      .eq('role', 'admin')
      .eq('notify_governance_digest', true)

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

    const { count: openIncidents } = await supabase
      .from('incidents')
      .select('id', { count: 'exact', head: true })
      .eq('organisation_id', org.id)
      .in('status', ['open', 'under_review'])

    // ── Overdue action items ──────────────────────────────────────────────

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
    // digestHtml's per-org numbers (readiness %, overdue counts, etc.) are
    // computed fresh every send, so a saved override is a static report
    // shell only -- useful for restyling wording/layout, not the figures
    // themselves. The generated default is passed straight through as the
    // fallback, and orgName/readinessPct/reportDate are exposed as tokens
    // for an override that wants to reference them.
    const defaultDigestHtml = digestHtml({
      orgName:           org.name,
      readinessPct,
      totalKlos,
      compliantKlos,
      overdueUnassigned,
      neverStarted,
      openIncidents:     openIncidents ?? 0,
      overdueActions:    overdueActions ?? 0,
      reportDate,
    })

    for (const adminEmail of adminEmails) {
      const result = await sendOnce(
        supabase,
        {
          organisationId:   org.id,
          notificationType: 'weekly_digest',
          entityType:       'governance_digest',
          entityId:         org.id,
          dueDate:          todayStr,
          recipientEmail:   adminEmail,
        },
        'governance-digest',
        async () => sendEmail({
          to:       adminEmail,
          subject:  `Weekly governance digest: ${org.name} (${readinessPct}% ready)`,
          bodyHtml: await renderTemplate(
            'governance_digest',
            { orgName: org.name, readinessPct: String(readinessPct), reportDate },
            defaultDigestHtml,
          ),
          type: 'transactional',
        })
      )

      if (result.status === 'sent') {
        emailsSent++
      } else if (result.status === 'already_sent') {
        emailsSkipped++
      } else {
        errors.push(`${org.id} → ${adminEmail}: ${result.status === 'failed' ? result.error : result.status}`)
      }
    }
  }

  console.log(`[governance-digest] sent=${emailsSent} skipped=${emailsSkipped} errors=${errors.length}`)

  return NextResponse.json({
    ok:      true,
    sent:    emailsSent,
    skipped: emailsSkipped,
    errors:  errors.length > 0 ? errors : undefined,
  })
}

export const GET = withHeartbeat('governance-digest', handler, createAdminClient)
