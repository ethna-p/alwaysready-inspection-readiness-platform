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
  dayKey:      string   // used as entity_id in notification_log
  dayIndex:    number   // days since trial start (trial_expires_at - 14 + dayIndex = send date)
  subject:     string
  isMarketing: boolean  // true = include unsubscribe footer; false = transactional, no opt-out
  bodyHtml:    (firstName: string, expiryDate: string, price: string, wizard?: WizardStatus) => string
}

const TRIAL_EMAILS: TrialEmailDef[] = [
  {
    dayKey:      'day_01',
    dayIndex:    1,
    isMarketing: false,
    subject:     'Welcome to AlwaysReady',
    bodyHtml: (firstName) => `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Hi ${firstName},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Welcome to AlwaysReady — your 14-day trial is live and your account is ready to go.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        The best first step is usually your KLOE tracker. Adding your current compliance status
        to a handful of KLOEs — even rough ratings at this stage — will give you an immediate
        picture of where your service stands. It takes about ten minutes and makes the rest of
        the platform click into place.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Over the next couple of weeks we'll send a few short emails with things worth exploring.
        Nothing demanding — just nudges to help you get the most out of your trial.
      </p>
      <p style="margin:0 0 32px">
        <a href="${PLATFORM_URL}/dashboard/kloes"
           style="display:inline-block;background-color:#014D4E;color:#ffffff;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:600;text-decoration:none">
          Go to your KLOE tracker &rarr;
        </a>
      </p>
      <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
        If anything isn't working the way you expected, just reply — we're glad to help.
      </p>
    `,
  },
  {
    dayKey:      'day_03',
    dayIndex:    3,
    isMarketing: false,
    subject:     'Three things worth trying',
    bodyHtml: (firstName) => `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Hi ${firstName},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Now you've had a couple of days to settle in, a few things worth trying.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        The Daily Report is a good place to start each morning — it shows which KLOEs need
        attention and which are looking strong, all in one view. The Inspection Pack is worth
        downloading too: one click and you have a printable summary of your compliance position
        across all KLOEs, ready to share with your team. And if you haven't tried attaching
        evidence to a KLOE yet, it takes about two minutes and makes everything feel much more real.
      </p>
      <p style="margin:0 0 32px">
        <a href="${PLATFORM_URL}/dashboard"
           style="display:inline-block;background-color:#014D4E;color:#ffffff;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:600;text-decoration:none">
          Go to your dashboard &rarr;
        </a>
      </p>
      <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
        Which of those three have you tried? Hit reply — we're curious.
      </p>
    `,
  },
  {
    dayKey:      'day_05',
    dayIndex:    5,
    isMarketing: false,
    subject:     'How are you getting on?',
    bodyHtml: (firstName) => `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Hi ${firstName},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Five days in — how's it going?
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        One thing that's worth doing before the halfway point: invite a colleague. AlwaysReady
        works best when responsibility is shared. You can add team members under Account → Team,
        assign them specific KLOEs to manage, and they'll get their own login. Evidence tends to
        get added consistently when it's someone's job, not everyone's afterthought.
      </p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#1a1a1a">
        If you're managing everything yourself for now, that's fine too — but even adding one
        other person usually changes how the platform feels.
      </p>
      <p style="margin:0 0 32px">
        <a href="${PLATFORM_URL}/dashboard/account?tab=team"
           style="display:inline-block;background-color:#014D4E;color:#ffffff;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:600;text-decoration:none">
          Invite a team member &rarr;
        </a>
      </p>
      <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
        If there's anything you're stuck on, just reply. We're a small team and we read every message.
      </p>
    `,
  },
  {
    dayKey:      'day_07',
    dayIndex:    7,
    isMarketing: false,
    subject:     'You\'re halfway through your trial — here\'s a quick checklist',
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
        ? `If you haven't had a chance to log in yet, now is a good moment — everything is set up and waiting. The four steps below each take about five minutes and will show you what AlwaysReady can do for your service.`
        : allDone
          ? `You've already completed all the setup steps — nicely done. Log in to keep building your readiness and make the most of the week you have left.`
          : `You've already made a start — well done. Here's where things stand and what's still worth exploring before your trial ends.`

      return `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Hi ${firstName},</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
          Halfway through — seven days down, seven to go.
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
        <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
          Drop us a message through the <strong>Support</strong> tab whenever you need us.
        </p>
      `
    },
  },
  {
    dayKey:      'day_09',
    dayIndex:    9,
    isMarketing: false,
    subject:     'Five days left — things worth finding before you go',
    bodyHtml: (firstName) => `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Hi ${firstName},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Five days left — a few things that are easy to miss but worth finding before your trial ends.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        The Audit Trail logs every change made to a KLOE — who updated it, when, and what changed.
        It's useful to know about before an inspection. The Trend Report shows how your readiness
        score has moved over time. And if you haven't looked at the HR module yet, it keeps DBS
        checks, training records, and supervision logs all in one place — accessible whenever you
        need them.
      </p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#1a1a1a">
        None of these take long to explore. Log in and have a look around.
      </p>
      <p style="margin:0 0 32px">
        <a href="${PLATFORM_URL}/dashboard"
           style="display:inline-block;background-color:#014D4E;color:#ffffff;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:600;text-decoration:none">
          Explore the platform &rarr;
        </a>
      </p>
      <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
        Questions about anything? Just reply.
      </p>
    `,
  },
  {
    dayKey:      'day_11',
    dayIndex:    11,
    isMarketing: true,
    subject:     'Your AlwaysReady trial ends in 3 days',
    bodyHtml: (firstName, expiryDate, price) => `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Hi ${firstName},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Your trial ends in <strong>3 days</strong>, on ${expiryDate}. Before you decide,
        here are a few things you might not have had time to explore — each one is included
        in your subscription.
      </p>

      <!-- Feature: Mock Inspection -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0"
        style="width:100%;margin:0 0 12px;border:1px solid #e5e5e0;border-radius:8px;overflow:hidden">
        <tr>
          <td style="padding:16px 20px">
            <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#014D4E">
              Mock Inspection
            </p>
            <p style="margin:0 0 10px;font-size:15px;line-height:1.7;color:#1a1a1a">
              Walk through every KLOE and rate your evidence as Outstanding, Good, Requires
              Improvement, or Inadequate. The platform generates a mock inspection report
              showing a self-assessed rating for each of the five CQC key questions — so you
              know exactly where you stand before an inspector walks through the door.
            </p>
            <a href="${PLATFORM_URL}/dashboard/mock-inspection"
               style="font-size:14px;font-weight:600;color:#014D4E;text-decoration:underline">
              Run a mock inspection &rarr;
            </a>
          </td>
        </tr>
      </table>

      <!-- Feature: Evidence Pack -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0"
        style="width:100%;margin:0 0 12px;border:1px solid #e5e5e0;border-radius:8px;overflow:hidden">
        <tr>
          <td style="padding:16px 20px">
            <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#014D4E">
              Evidence Pack
            </p>
            <p style="margin:0 0 10px;font-size:15px;line-height:1.7;color:#1a1a1a">
              One click generates a printable PDF summary of your full compliance position —
              RAG status, review dates, priority ratings, and evidence location notes for every
              KLOE. It is designed to be handed to an inspector or presented at a board meeting,
              without you needing to prepare anything in advance.
            </p>
            <a href="${PLATFORM_URL}/dashboard"
               style="font-size:14px;font-weight:600;color:#014D4E;text-decoration:underline">
              Download your Evidence Pack &rarr;
            </a>
          </td>
        </tr>
      </table>

      <!-- Feature: HR Records -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0"
        style="width:100%;margin:0 0 12px;border:1px solid #e5e5e0;border-radius:8px;overflow:hidden">
        <tr>
          <td style="padding:16px 20px">
            <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#014D4E">
              HR Records
            </p>
            <p style="margin:0 0 10px;font-size:15px;line-height:1.7;color:#1a1a1a">
              Track DBS checks, supervision sessions, appraisals, mandatory training, and
              holiday entitlement for every member of staff — all in one place. The HR
              dashboard shows you which staff members are overdue or due soon at a glance,
              and the platform sends automatic email reminders when a check is approaching.
            </p>
            <a href="${PLATFORM_URL}/dashboard/hr"
               style="font-size:14px;font-weight:600;color:#014D4E;text-decoration:underline">
              Explore HR Records &rarr;
            </a>
          </td>
        </tr>
      </table>

      <!-- Feature: Automatic reminders -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0"
        style="width:100%;margin:0 0 28px;border:1px solid #e5e5e0;border-radius:8px;overflow:hidden">
        <tr>
          <td style="padding:16px 20px">
            <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#014D4E">
              Automatic reminders
            </p>
            <p style="margin:0 0 10px;font-size:15px;line-height:1.7;color:#1a1a1a">
              Set a review frequency for each KLOE — monthly, quarterly, annually, or a
              custom interval — and AlwaysReady handles the rest. The platform emails the
              relevant team member when a review is due soon or overdue, so nothing slips
              through the gap between inspections.
            </p>
            <a href="${PLATFORM_URL}/dashboard/kloes"
               style="font-size:14px;font-weight:600;color:#014D4E;text-decoration:underline">
              Set review dates &rarr;
            </a>
          </td>
        </tr>
      </table>

      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        All of this — plus everything you have already built during your trial — continues
        without interruption when you subscribe for <strong>${price}/month</strong>.
        Your KLOEs, evidence, HR records, and team settings stay exactly as they are.
      </p>
      <p style="margin:0 0 32px">
        <a href="${PLATFORM_URL}/upgrade"
           style="display:inline-block;background-color:#014D4E;color:#ffffff;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:600;text-decoration:none">
          Subscribe now &rarr;
        </a>
      </p>
      <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
        Questions before you decide? Just reply.
      </p>
    `,
  },
  {
    dayKey:      'day_13',
    dayIndex:    13,
    isMarketing: true,
    subject:     'Your trial ends tomorrow',
    bodyHtml: (firstName, expiryDate, price) => `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Hi ${firstName},</p>
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
      <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
        Thank you for taking the time to try AlwaysReady. Whatever you decide, we hope it's
        been a useful experience.
      </p>
    `,
  },
]

// ── User onboarding email definitions ────────────────────────────────────────
// Sent to role='user' accounts based on days since they joined the platform.
// Timing is relative to the user's created_at, not the org's trial start.

type UserEmailDef = {
  dayKey:   string
  dayIndex: number
  subject:  string
  bodyHtml: (firstName: string, orgName: string) => string
}

const USER_EMAILS: UserEmailDef[] = [
  {
    dayKey:   'user_day_01',
    dayIndex: 1,
    subject:  'Welcome to AlwaysReady — here\'s how to get started',
    bodyHtml: (firstName, orgName) => `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Hi ${firstName},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        You've been added to <strong>${orgName}</strong>'s AlwaysReady account.
        AlwaysReady is an inspection readiness platform that helps adult social care providers
        prepare for a CQC inspection — and you're now part of the team helping to build
        your service's readiness.
      </p>
      <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#1a1a1a">Your role on the platform</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        As a team member, you may be assigned specific KLOEs (Key Lines of Enquiry) to manage.
        These are the areas the CQC inspects against — Safe, Effective, Caring, Responsive,
        and Well-led. When you're assigned a KLOE, you'll receive an email notification with a
        direct link. From there you can:
      </p>
      <ul style="margin:0 0 24px;padding-left:24px;font-size:15px;line-height:1.9;color:#1a1a1a">
        <li>Record your service's current compliance status for that area</li>
        <li>Upload supporting evidence — policies, audits, certificates, and more</li>
        <li>Add notes that will be useful during an inspection</li>
      </ul>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Log in to your account to see any KLOEs already assigned to you. If none have been
        assigned yet, your account admin will be in touch shortly.
      </p>
      <p style="margin:0 0 32px">
        <a href="${PLATFORM_URL}/dashboard/kloes"
           style="display:inline-block;background-color:#014D4E;color:#ffffff;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:600;text-decoration:none">
          Log in to AlwaysReady &rarr;
        </a>
      </p>
      <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
        If you have any questions, use the <strong>Help</strong> tab for guidance by role, or
        the <strong>Support</strong> tab to reach our team directly.
      </p>
    `,
  },
  {
    dayKey:   'user_day_07',
    dayIndex: 7,
    subject:  'A quick check-in on your KLOEs',
    bodyHtml: (firstName, _orgName) => `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Hi ${firstName},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        You've been on AlwaysReady for a week. We wanted to check in and make sure
        you've had a chance to get started.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        If you have KLOEs assigned to you, now is a good time to log in and:
      </p>
      <ul style="margin:0 0 24px;padding-left:24px;font-size:15px;line-height:1.9;color:#1a1a1a">
        <li>Set a compliance rating for each KLOE you're responsible for</li>
        <li>Upload at least one piece of supporting evidence per KLOE</li>
        <li>Add any notes that would be useful to have on record during an inspection</li>
      </ul>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        The more evidence your team adds, the stronger your service's inspection readiness
        position will be. Every contribution counts.
      </p>
      <p style="margin:0 0 32px">
        <a href="${PLATFORM_URL}/dashboard/kloes"
           style="display:inline-block;background-color:#014D4E;color:#ffffff;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:600;text-decoration:none">
          Go to your KLOEs &rarr;
        </a>
      </p>
      <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
        If you're not sure what's expected of you, just reply to this email — we're happy to help.
        The <strong>Help</strong> tab also covers the most common questions by role.
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
        type:     emailDef.isMarketing ? 'marketing' : 'transactional',
        ...(emailDef.isMarketing ? { userId: admin.id } : {}),
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
    // Set data_deletion_due_at (idempotent — only if not already set)
    const trialDeletionDue = new Date()
    trialDeletionDue.setDate(trialDeletionDue.getDate() + 30)
    await supabase
      .from('organisations')
      .update({ data_deletion_due_at: trialDeletionDue.toISOString() })
      .eq('id', org.id)
      .is('data_deletion_due_at', null)   // don't overwrite if already set

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

      const firstName    = admin.full_name?.split(' ')[0] ?? 'there'
      const expiryDate   = formatDate(`${yesterdayStr}T00:00:00Z`)
      const deletionDate = formatDate(trialDeletionDue.toISOString())
      const upgradeUrl   = `${PLATFORM_URL}/upgrade`

      const result = await sendEmail({
        to:      admin.email,
        subject: 'Your AlwaysReady trial has ended',
        type:    'transactional',
        bodyHtml: `
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Hi ${firstName},</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
            Your AlwaysReady trial ended on ${expiryDate}. The KLOEs you rated, evidence you
            uploaded, and any HR records or team settings you created are all still there —
            exactly as you left them.
          </p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
            Your data is available to download until <strong>${deletionDate}</strong>, after
            which it will be permanently deleted. If you'd like to keep access and continue
            building your inspection readiness, subscribing takes less than two minutes —
            everything carries over immediately.
          </p>
          <p style="margin:0 0 32px">
            <a href="${upgradeUrl}"
               style="display:inline-block;background-color:#014D4E;color:#ffffff;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:600;text-decoration:none">
              Subscribe and continue &rarr;
            </a>
          </p>
          <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
            If there's anything we could have done better, we'd genuinely welcome hearing from
            you — just reply to this email. Whatever you decide, thank you for taking the time
            to try AlwaysReady.
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

  // ── User onboarding emails ──────────────────────────────────────────────────
  // Sent to role='user' accounts based on days since their created_at.
  // Runs for all orgs (trial and active) so newly invited users always get onboarded.

  const { data: allUsers } = await supabase
    .from('users')
    .select('id, email, full_name, organisation_id, created_at')
    .eq('role', 'user')
    .not('email', 'is', null)
    .not('created_at', 'is', null)

  for (const usr of allUsers ?? []) {
    if (!usr.email || !usr.organisation_id || !usr.created_at) continue

    const userCreated = new Date(usr.created_at)
    userCreated.setHours(0, 0, 0, 0)
    const daysSinceJoining = Math.floor((today.getTime() - userCreated.getTime()) / (24 * 60 * 60 * 1000))

    const emailDef = USER_EMAILS.find(e => e.dayIndex === daysSinceJoining)
    if (!emailDef) continue

    // Fetch org name
    const { data: org } = await supabase
      .from('organisations')
      .select('name')
      .eq('id', usr.organisation_id)
      .single()

    const firstName  = usr.full_name?.split(' ')[0] ?? 'there'
    const orgName    = org?.name ?? 'your organisation'
    const dueDateKey = today.toISOString().split('T')[0]

    // Idempotency check
    const { data: existing } = await supabase
      .from('notification_log')
      .select('id')
      .eq('organisation_id',   usr.organisation_id)
      .eq('notification_type', 'user_onboarding')
      .eq('entity_type',       'user')
      .eq('entity_id',         emailDef.dayKey)
      .eq('recipient_email',   usr.email)
      .maybeSingle()

    if (existing) { emailsSkipped++; continue }

    const result = await sendEmail({
      to:       usr.email,
      subject:  emailDef.subject,
      bodyHtml: emailDef.bodyHtml(firstName, orgName),
      type:     'transactional',
    })

    if (result.sent) {
      await supabase.from('notification_log').insert({
        organisation_id:   usr.organisation_id,
        notification_type: 'user_onboarding',
        entity_type:       'user',
        entity_id:         emailDef.dayKey,
        due_date:          dueDateKey,
        recipient_email:   usr.email,
      })
      emailsSent++
      console.log(`[trial-emails] Sent ${emailDef.dayKey} to ${usr.email} (${orgName})`)
    } else {
      errors.push(`${emailDef.dayKey} → ${usr.email}: ${result.error ?? result.skipped}`)
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
