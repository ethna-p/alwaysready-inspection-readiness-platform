/**
 * GET /api/cron/trial-emails
 *
 * Nightly cron (08:30 UTC daily) that sends the trial lifecycle email sequence
 * to every active trial organisation.
 *
 * Email schedule (keyed by days elapsed since trial start):
 *   Day  1 — Welcome to AlwaysReady
 *   Day  3 — Three things worth exploring
 *   Day  5 — How are you getting on?
 *   Day  7 — Halfway through your trial
 *   Day  9 — A few things you might not have tried yet
 *   Day 11 — Your trial ends in 3 days
 *   Day 13 — Your trial ends tomorrow
 *
 * Day 14a (converted) and 14b (lapsed) are triggered by Stripe webhooks, not here.
 *
 * Protected by CRON_SECRET (Vercel sends this automatically for registered crons).
 * Uses notification_log for idempotency — each email fires at most once per
 * organisation per day-key per trial_expires_at anchor.
 */

import 'server-only'
import { NextResponse }      from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail }         from '@/lib/email'

const PLATFORM_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://portal.alwaysready.uk').replace(/\/$/, '')

// ── Trial email definitions ───────────────────────────────────────────────────

type OrgForTrialEmail = { id: string; name: string; subscription_tier: string; trial_expires_at: string; is_charity: boolean }

type WizardStatus = {
  hasKloeRating:  boolean
  hasEvidence:    boolean
  hasTeamMember:  boolean
  hasHrRecord:    boolean
}

type TrialEmailDef = {
  dayKey:   string   // used as entity_id in notification_log
  dayIndex: number   // days since trial start (trial_expires_at - 14 + dayIndex = send date)
  subject:  string
  bodyHtml: (firstName: string, expiryDate: string, price: string, wizard?: WizardStatus) => string
}

const TRIAL_EMAILS: TrialEmailDef[] = [
  {
    dayKey:   'day_01',
    dayIndex: 1,
    subject:  'Welcome to AlwaysReady',
    bodyHtml: (firstName) => `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${firstName},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Welcome to AlwaysReady. Your 14-day free trial is now active and your account is ready to use.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        AlwaysReady is designed to help adult social care providers prepare for a CQC inspection with confidence.
        Over the next two weeks, we hope you enjoy exploring the platform — but if you'd like a
        starting point, we suggest beginning with your KLOEs. Adding your current compliance
        status to even a handful of areas will give you an immediate picture of where you stand.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Over the coming days, we'll send you a short series of emails with tips and suggestions
        to help you get the most from your inspection readiness platform.
      </p>
      <p style="margin:0 0 32px">
        <a href="${PLATFORM_URL}/dashboard/kloes"
           style="display:inline-block;background-color:#014D4E;color:#ffffff;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:600;text-decoration:none">
          Go to your KLOE tracker &rarr;
        </a>
      </p>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#555">
        If you have any questions at any point, our support team is available via the
        <strong>Support</strong> tab within the platform.
      </p>
    `,
  },
  {
    dayKey:   'day_03',
    dayIndex: 3,
    subject:  'Three things worth exploring in AlwaysReady',
    bodyHtml: (firstName) => `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${firstName},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Now that you've had a couple of days to settle in, we wanted to highlight three features
        that our users find particularly valuable.
      </p>
      <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#1a1a1a">
        <strong style="color:#014D4E">The Daily Report</strong> gives you a snapshot of your
        current compliance position — which KLOEs need attention, what's overdue, and what's
        looking strong. It's designed to be the first thing a manager checks at the start of
        the day.
      </p>
      <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#1a1a1a">
        <strong style="color:#014D4E">Evidence uploads</strong> allow you to attach documents
        directly to each KLOE — policies, audits, meeting minutes, certificates. Everything is
        stored securely and is accessible during an inspection.
      </p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#1a1a1a">
        <strong style="color:#014D4E">The Inspection Pack</strong> generates a single
        downloadable document summarising your readiness across all KLOEs — useful as a
        teaching tool for your team or as a reference when preparing for review.
      </p>
      <p style="margin:0 0 32px">
        <a href="${PLATFORM_URL}/dashboard"
           style="display:inline-block;background-color:#014D4E;color:#ffffff;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:600;text-decoration:none">
          Go to your dashboard &rarr;
        </a>
      </p>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#555">
        If you have any questions, the <strong>Support</strong> tab inside the platform is the
        best place to reach us.
      </p>
    `,
  },
  {
    dayKey:   'day_05',
    dayIndex: 5,
    subject:  'How are you getting on?',
    bodyHtml: (firstName) => `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${firstName},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        You're five days into your AlwaysReady trial — we hope it's been a useful start.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        If you've had any difficulties or have questions about how to get the most from the
        platform, there are a few ways we can help:
      </p>
      <ul style="margin:0 0 24px;padding-left:24px;font-size:15px;line-height:1.9;color:#1a1a1a">
        <li>The <strong>Help</strong> tab in the top navigation covers the most common questions by role</li>
        <li>The <strong>Support</strong> tab allows you to raise a query directly with our team</li>
      </ul>
      <p style="margin:0 0 32px">
        <a href="${PLATFORM_URL}/dashboard/support"
           style="display:inline-block;background-color:#014D4E;color:#ffffff;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:600;text-decoration:none">
          Get in touch &rarr;
        </a>
      </p>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#555">
        We're committed to making sure AlwaysReady works well for your service, and we welcome
        any feedback you have at this stage.
      </p>
    `,
  },
  {
    dayKey:   'day_07',
    dayIndex: 7,
    subject:  'You\'re halfway through your trial — here\'s a quick checklist',
    bodyHtml: (firstName, _expiryDate, _price, wizard) => {
      const w = wizard ?? { hasKloeRating: false, hasEvidence: false, hasTeamMember: false, hasHrRecord: false }
      const completedCount = [w.hasKloeRating, w.hasEvidence, w.hasTeamMember, w.hasHrRecord].filter(Boolean).length
      const allDone = completedCount === 4
      const nonStarted = completedCount === 0

      // Render one checklist row — ticked if done, linked if not
      function row(done: boolean, label: string, detail: string, href: string): string {
        if (done) {
          return `
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;vertical-align:top;width:28px">
                <span style="display:inline-flex;align-items:center;justify-content:center;
                             width:20px;height:20px;border-radius:50%;background:#00b8a6;
                             color:#fff;font-size:12px;font-weight:700;line-height:1">✓</span>
              </td>
              <td style="padding:10px 0 10px 12px;border-bottom:1px solid #f0f0f0">
                <span style="font-size:15px;color:#9ca3af;text-decoration:line-through">${label}</span>
              </td>
            </tr>`
        }
        return `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;vertical-align:top;width:28px">
              <span style="display:inline-flex;align-items:center;justify-content:center;
                           width:20px;height:20px;border-radius:50%;border:2px solid #014D4E"></span>
            </td>
            <td style="padding:10px 0 10px 12px;border-bottom:1px solid #f0f0f0">
              <span style="font-size:15px;font-weight:600;color:#1a1a1a">${label}</span><br>
              <span style="font-size:13px;color:#6b7280;line-height:1.5">${detail} —
                <a href="${href}" style="color:#014D4E;font-weight:600">Go there now →</a>
              </span>
            </td>
          </tr>`
      }

      const introText = nonStarted
        ? `If you haven't had a chance to log in yet, now is a great moment to start — everything is set up and waiting for you. The four steps below each take just a few minutes and will immediately show you what AlwaysReady can do for your service.`
        : allDone
          ? `You've already completed all the key setup steps — that's a great start. Log in to continue building your inspection readiness and make the most of your remaining trial time.`
          : `You've already made a start — well done. Here's a summary of what you've done and what's still worth exploring before your trial ends.`

      return `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${firstName},</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
          You have 7 days remaining on your AlwaysReady trial — you're at the halfway point.
        </p>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#1a1a1a">${introText}</p>
        <table style="width:100%;border-collapse:collapse;margin:0 0 28px">
          ${row(w.hasKloeRating,  'Rate your KLOEs',           'Open any KLOE and set your current compliance status',            `${PLATFORM_URL}/dashboard/kloes`)}
          ${row(w.hasEvidence,    'Upload your first evidence', 'Attach a policy, audit, or certificate to a KLOE',               `${PLATFORM_URL}/dashboard/kloes`)}
          ${row(w.hasTeamMember,  'Invite a team member',       'Give a colleague their own login under Account → Team',           `${PLATFORM_URL}/dashboard/account?tab=team`)}
          ${row(w.hasHrRecord,    'Add a staff record',         'Create your first HR profile to explore the HR module',           `${PLATFORM_URL}/dashboard/hr`)}
        </table>
        <p style="margin:0 0 32px">
          <a href="${PLATFORM_URL}/dashboard"
             style="display:inline-block;background-color:#014D4E;color:#ffffff;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:600;text-decoration:none">
            Go to your dashboard &rarr;
          </a>
        </p>
        <p style="margin:0;font-size:14px;line-height:1.6;color:#555">
          If you need any help, the <strong>Support</strong> tab inside the platform is the
          best place to reach us.
        </p>
      `
    },
  },
  {
    dayKey:   'day_09',
    dayIndex: 9,
    subject:  'A few things you might not have tried yet',
    bodyHtml: (firstName) => `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${firstName},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        With five days of your trial remaining, we wanted to share a few features that are
        easy to miss but genuinely useful in practice.
      </p>
      <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#1a1a1a">
        <strong style="color:#014D4E">The Audit Trail</strong> keeps a complete record of every
        change made to a KLOE — who updated it, when, and what changed. This can be invaluable
        during an inspection when you need to demonstrate how your compliance position has
        developed over time.
      </p>
      <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#1a1a1a">
        <strong style="color:#014D4E">Visitor access</strong> allows you to grant a read-only
        login to an external reviewer, consultant, or responsible individual — without giving
        them editing rights. Access expires automatically. You'll find this under the
        <strong>Team</strong> tab.
      </p>
      <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#1a1a1a">
        <strong style="color:#014D4E">The Trend Report</strong> shows your readiness score
        over time, so you can see at a glance whether your overall compliance position is
        improving.
      </p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#1a1a1a">
        <strong style="color:#014D4E">The HR module</strong> keeps your staff records,
        training certificates, DBS checks, supervision logs, and appraisal records in one
        place — all accessible during an inspection.
      </p>
      <p style="margin:0 0 32px">
        <a href="${PLATFORM_URL}/dashboard"
           style="display:inline-block;background-color:#014D4E;color:#ffffff;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:600;text-decoration:none">
          Explore these features &rarr;
        </a>
      </p>
    `,
  },
  {
    dayKey:   'day_11',
    dayIndex: 11,
    subject:  'Your AlwaysReady trial ends in 3 days',
    bodyHtml: (firstName, expiryDate, price) => `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${firstName},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Your free trial ends in <strong>3 days</strong>, on ${expiryDate}.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        If you're happy to continue, you can subscribe now for <strong>${price}/month</strong>
        and keep everything exactly as it is — all your KLOEs, evidence, and records stay in place.
      </p>
      <p style="margin:0 0 32px">
        <a href="${PLATFORM_URL}/upgrade"
           style="display:inline-block;background-color:#014D4E;color:#ffffff;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:600;text-decoration:none">
          Subscribe now &rarr;
        </a>
      </p>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#555">
        If you have any questions before then, the <strong>Support</strong> tab inside the
        platform is the best place to reach us.
      </p>
    `,
  },
  {
    dayKey:   'day_13',
    dayIndex: 13,
    subject:  'Your trial ends tomorrow',
    bodyHtml: (firstName, expiryDate, price) => `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${firstName},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Your AlwaysReady trial ends <strong>tomorrow</strong>, on ${expiryDate}.
      </p>
      <div style="margin:0 0 16px;padding:16px 20px;background:#f5f4f1;border-left:4px solid #014D4E;border-radius:4px">
        <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#1a1a1a">
          <strong>If you'd like to continue:</strong> subscribe now for ${price}/month and your
          account continues without interruption. All your data and settings remain exactly as they are.
        </p>
        <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
          <strong>If you'd like to stop:</strong> simply do nothing. Your account will be
          suspended when the trial ends and you will not be charged.
        </p>
      </div>
      <p style="margin:0 0 32px">
        <a href="${PLATFORM_URL}/upgrade"
           style="display:inline-block;background-color:#014D4E;color:#ffffff;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:600;text-decoration:none">
          Subscribe and continue &rarr;
        </a>
      </p>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#555">
        Thank you for taking the time to try AlwaysReady. Whatever you decide, we hope it's
        been a useful experience.
      </p>
    `,
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function daysElapsed(trialExpiresAt: string, today: Date): number {
  const expires = new Date(trialExpiresAt)
  expires.setHours(0, 0, 0, 0)
  const t = new Date(today)
  t.setHours(0, 0, 0, 0)
  // Trial is 14 days; start = expires - 14 days
  const start = new Date(expires.getTime() - 14 * 24 * 60 * 60 * 1000)
  return Math.floor((t.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
}


// ── Cron handler ──────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const secret     = process.env.CRON_SECRET
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const today    = new Date()
  today.setHours(0, 0, 0, 0)

  let emailsSent    = 0
  let emailsSkipped = 0
  const errors: string[] = []

  // Fetch all active trial orgs
  const { data: orgs, error: orgsError } = await supabase
    .from('organisations')
    .select('id, name, subscription_tier, trial_expires_at, is_charity')
    .eq('subscription_tier', 'trial')
    .not('trial_expires_at', 'is', null)

  if (orgsError || !orgs) {
    console.error('[trial-emails] Failed to fetch orgs:', orgsError)
    return NextResponse.json({ error: 'Failed to fetch organisations' }, { status: 500 })
  }

  for (const org of orgs) {
    if (!org.trial_expires_at) continue

    // Skip orgs whose trial has already expired (past day 14)
    const elapsed = daysElapsed(org.trial_expires_at, today)
    if (elapsed < 0 || elapsed > 13) continue

    // Find which email to send today, if any
    const emailDef = TRIAL_EMAILS.find(e => e.dayIndex === elapsed)
    if (!emailDef) continue

    // Fetch the admin user for this org
    const { data: admins } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('organisation_id', org.id)
      .eq('role', 'admin')

    if (!admins || admins.length === 0) continue

    const expiryDate = formatDate(org.trial_expires_at)
    // Charities pay £50, everyone else pays £75
    const price      = org.is_charity ? '£50' : '£75'
    const dueDateKey = org.trial_expires_at.split('T')[0]

    for (const admin of admins) {
      if (!admin.email) continue

      const firstName = admin.full_name?.split(' ')[0] ?? 'there'

      // Check if already sent
      const { data: existing } = await supabase
        .from('notification_log')
        .select('id')
        .eq('organisation_id',   org.id)
        .eq('notification_type', 'trial_day')
        .eq('entity_type',       'trial')
        .eq('entity_id',         emailDef.dayKey)
        .eq('due_date',          dueDateKey)
        .eq('recipient_email',   admin.email)
        .maybeSingle()

      if (existing) {
        emailsSkipped++
        continue
      }

      // For day_07, query the org's actual wizard status to personalise the checklist
      let wizard: WizardStatus | undefined
      if (emailDef.dayKey === 'day_07') {
        const [kloeRes, evidenceRes, teamRes, hrRes] = await Promise.all([
          supabase.from('compliance_records').select('id').eq('organisation_id', org.id).not('status', 'is', null).limit(1),
          supabase.from('kloe_evidence').select('id').eq('organisation_id', org.id).limit(1),
          supabase.from('users').select('id').eq('organisation_id', org.id).limit(2),
          supabase.from('hr_staff_profiles').select('id').eq('organisation_id', org.id).limit(1),
        ])
        wizard = {
          hasKloeRating:  (kloeRes.data?.length     ?? 0) > 0,
          hasEvidence:    (evidenceRes.data?.length  ?? 0) > 0,
          hasTeamMember:  (teamRes.data?.length      ?? 0) > 1,
          hasHrRecord:    (hrRes.data?.length        ?? 0) > 0,
        }
      }

      const bodyHtml = emailDef.bodyHtml(firstName, expiryDate, price, wizard)

      const result = await sendEmail({
        to:       admin.email,
        subject:  emailDef.subject,
        bodyHtml,
        type:     'transactional',
      })

      if (result.sent) {
        await supabase.from('notification_log').insert({
          organisation_id:   org.id,
          notification_type: 'trial_day',
          entity_type:       'trial',
          entity_id:         emailDef.dayKey,
          due_date:          dueDateKey,
          recipient_email:   admin.email,
        })
        emailsSent++
        console.log(`[trial-emails] Sent ${emailDef.dayKey} to ${admin.email} (${org.name})`)
      } else {
        errors.push(`${emailDef.dayKey} → ${admin.email}: ${result.error ?? result.skipped}`)
      }
    }
  }

  // ── Day 14b — trial lapsed ────────────────────────────────────────────────
  // Find orgs whose trial expired yesterday and who never subscribed.
  // (If they subscribed, subscription_tier would have been set to 'active' by
  // the Stripe webhook; if it's still 'trial' they quietly lapsed.)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  const { data: lapsedOrgs } = await supabase
    .from('organisations')
    .select('id, name, is_charity')
    .eq('subscription_tier', 'trial')
    .gte('trial_expires_at', `${yesterdayStr}T00:00:00.000Z`)
    .lt('trial_expires_at',  `${yesterdayStr}T23:59:59.999Z`)

  for (const org of lapsedOrgs ?? []) {
    const { data: admins } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('organisation_id', org.id)
      .eq('role', 'admin')

    for (const admin of admins ?? []) {
      if (!admin.email) continue

      // Check if already sent
      const { data: existing } = await supabase
        .from('notification_log')
        .select('id')
        .eq('organisation_id',   org.id)
        .eq('notification_type', 'trial_day')
        .eq('entity_type',       'trial')
        .eq('entity_id',         'day_14b')
        .eq('due_date',          yesterdayStr)
        .eq('recipient_email',   admin.email)
        .maybeSingle()

      if (existing) { emailsSkipped++; continue }

      const firstName  = admin.full_name?.split(' ')[0] ?? 'there'
      const expiryDate = formatDate(`${yesterdayStr}T00:00:00Z`)
      const upgradeUrl = `${PLATFORM_URL}/upgrade`

      const result = await sendEmail({
        to:      admin.email,
        subject: 'Your AlwaysReady trial has ended',
        type:    'transactional',
        bodyHtml: `
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${firstName},</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
            Your AlwaysReady trial ended on ${expiryDate}. Your data is safe and will be
            retained by us for 30 days. To regain access to the AlwaysReady platform,
            click the <strong>Subscribe</strong> button below at any time — everything
            will be exactly as you left it.
          </p>
          <p style="margin:0 0 32px">
            <a href="${upgradeUrl}"
               style="display:inline-block;background-color:#014D4E;color:#ffffff;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:600;text-decoration:none">
              Subscribe now &rarr;
            </a>
          </p>
          <p style="margin:0;font-size:14px;line-height:1.6;color:#555">
            If you have any feedback about your experience, or if there's anything we could have
            done better, we'd genuinely welcome hearing from you at
            <a href="mailto:support@alwaysready.uk" style="color:#014D4E">support@alwaysready.uk</a>.
          </p>
        `,
      })

      if (result.sent) {
        await supabase.from('notification_log').insert({
          organisation_id:   org.id,
          notification_type: 'trial_day',
          entity_type:       'trial',
          entity_id:         'day_14b',
          due_date:          yesterdayStr,
          recipient_email:   admin.email,
        })
        emailsSent++
        console.log(`[trial-emails] Sent day_14b to ${admin.email} (${org.name})`)
      } else {
        errors.push(`day_14b → ${admin.email}: ${result.error ?? result.skipped}`)
      }
    }
  }

  console.log(`[trial-emails] sent=${emailsSent} skipped=${emailsSkipped} errors=${errors.length}`)
  if (errors.length > 0) console.error('[trial-emails] errors:', errors)

  return NextResponse.json({
    ok:      true,
    sent:    emailsSent,
    skipped: emailsSkipped,
    errors:  errors.length > 0 ? errors : undefined,
  })
}
