'use server'

import { assertSuperadmin } from '@/lib/assert-superadmin'
import { sendEmail } from '@/lib/email'

const PLATFORM_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://portal.alwaysready.uk').replace(/\/$/, '')
const FIRST_NAME   = 'Sarah'
const ORG_NAME     = 'Sunrise Care Home'
const STAFF_NAME   = 'James Mitchell'
const KLOE_TITLE   = 'Safe — Safeguarding Systems, Processes and Practices'
const EXPIRY_DATE  = '14 September 2025'
const REF          = 'AR-0042'

export interface TestEmailResult {
  subject: string
  sent: boolean
  error?: string
}

export interface TestEmailsSummary {
  count: number
  sent: number
  failed: TestEmailResult[]
  results: TestEmailResult[]
}

export type EmailGroup =
  | 'website'
  | 'trial'
  | 'onboarding'
  | 'support'
  | 'kloe'
  | 'hr'
  | 'account'
  | 'all'

// ── Helpers ──────────────────────────────────────────────────────────────────

async function makeSender(to: string) {
  return async function send(
    subject: string,
    bodyHtml: string,
    type: 'transactional' | 'marketing' = 'transactional',
  ): Promise<TestEmailResult> {
    const r = await sendEmail({ to, subject: `[TEST] ${subject}`, bodyHtml, type })
    return { subject, sent: r.sent, error: r.error }
  }
}

// ── Group senders ─────────────────────────────────────────────────────────────

async function sendWebsite(send: Awaited<ReturnType<typeof makeSender>>) {
  return Promise.all([
    send("You're on the AlwaysReady waitlist", `
      <p>Hi ${FIRST_NAME},</p>
      <p>Thank you for joining the AlwaysReady waitlist. You're in good company.</p>
      <p>We're building AlwaysReady around the new CQC Adult Social Care Assessment Framework,
         and we'll open to new customers as soon as the framework is published.
         When that happens, you'll be the first to know.</p>
      <p>If you have any questions about the platform, feel free to visit
         <a href="https://alwaysready.uk/contact" style="color:#014D4E">alwaysready.uk/contact</a>.</p>
    `),
    send("We've received your message", `
      <p>Hi ${FIRST_NAME},</p>
      <p>Thank you for getting in touch. We've received your message and will get back to you shortly.</p>
      <p>While you wait, you may find an answer straight away. Our FAQs cover
        <a href="https://alwaysready.uk/waitlist/" style="color:#014D4E">how AlwaysReady works</a>
        and
        <a href="https://alwaysready.uk/pricing/" style="color:#014D4E">pricing</a>.
        If you'd prefer to ask a question in your own words, our platform assistant is available
        on every page of <a href="https://alwaysready.uk" style="color:#014D4E">alwaysready.uk</a>
        — look for the chat icon in the bottom-right corner.
      </p>
    `),
    send("You're subscribed to the AlwaysReady blog", `
      <p>Hi ${FIRST_NAME},</p>
      <p>Thanks for subscribing to the AlwaysReady blog. We cover CQC inspection readiness,
         compliance, and governance for care providers. New posts will arrive straight to your inbox.</p>
      <p>You can browse everything we've published so far at
         <a href="https://alwaysready.uk/blog" style="color:#014D4E">alwaysready.uk/blog</a>.</p>
    `),
  ])
}

async function sendTrial(send: Awaited<ReturnType<typeof makeSender>>) {
  const emails = [
    send("Your AlwaysReady trial is ready — set your password to get started", `
      <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${FIRST_NAME},</p>
      <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Your 14-day free trial of AlwaysReady is ready. Click the button below to
        set your password and get straight into your account.
      </p>
      <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">
        We have set up <strong style="color:#014D4E">${ORG_NAME}</strong>
        with your CQC KLOE framework. You can start recording your compliance
        position, uploading evidence, and building your inspection readiness straight away.
      </p>
      <p style="margin:0 0 32px">
        <a href="${PLATFORM_URL}/account/setup?token=EXAMPLE_TOKEN"
           style="display:inline-block;background-color:#014D4E;color:#ffffff;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:600;text-decoration:none">
          Set your password and get started &rarr;
        </a>
      </p>
      <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#555">
        Your trial runs until <strong>${EXPIRY_DATE}</strong>.
        If you have any questions, use the <strong>Support</strong> tab inside
        the platform and we will get back to you within three business days.
      </p>
    `),
    send("Welcome to AlwaysReady", `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${FIRST_NAME},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Welcome to AlwaysReady. Your 14-day free trial is now active and your account is ready to use.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        AlwaysReady is designed to help care providers prepare for CQC inspection with confidence.
        Over the next two weeks, we hope you enjoy exploring the platform. If you'd like a starting point,
        we suggest beginning with your KLOEs. Adding your current compliance status to even a handful
        of areas will give you an immediate picture of where you stand.
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
    `),
    send("Three things worth exploring in AlwaysReady", `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${FIRST_NAME},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Now that you've had a couple of days to settle in, we wanted to highlight three features
        that our users find particularly valuable.
      </p>
      <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#1a1a1a">
        <strong style="color:#014D4E">The Daily Report</strong> gives you a snapshot of your
        current compliance position — which KLOEs need attention, what's overdue, and what's
        looking strong.
      </p>
      <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#1a1a1a">
        <strong style="color:#014D4E">Evidence uploads</strong> allow you to attach documents
        directly to each KLOE — policies, audits, meeting minutes, certificates.
      </p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#1a1a1a">
        <strong style="color:#014D4E">The Inspection Pack</strong> generates a single
        downloadable document summarising your readiness across all KLOEs.
      </p>
      <p style="margin:0 0 32px">
        <a href="${PLATFORM_URL}/dashboard"
           style="display:inline-block;background-color:#014D4E;color:#ffffff;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:600;text-decoration:none">
          Go to your dashboard &rarr;
        </a>
      </p>
    `),
    send("How are you getting on?", `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${FIRST_NAME},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        You're five days into your AlwaysReady trial. We hope it's been a useful start.
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
    `),
    send("You're halfway through your trial — here's a quick checklist", `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${FIRST_NAME},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        You have 7 days remaining on your AlwaysReady trial. You're at the halfway point —
        a good moment to take stock.
      </p>
      <ul style="margin:0 0 24px;padding-left:24px;font-size:15px;line-height:1.9;color:#1a1a1a">
        <li>Add your compliance status across your key KLOEs</li>
        <li>Upload at least one piece of supporting evidence</li>
        <li>Review your Daily Report and Readiness Dashboard</li>
        <li>Share access with a colleague if you'd like a second opinion</li>
      </ul>
      <p style="margin:0 0 32px">
        <a href="${PLATFORM_URL}/dashboard"
           style="display:inline-block;background-color:#014D4E;color:#ffffff;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:600;text-decoration:none">
          Go to your dashboard &rarr;
        </a>
      </p>
    `),
    send("A few things you might not have tried yet", `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${FIRST_NAME},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        With five days of your trial remaining, we wanted to share a few features that are
        easy to miss but genuinely useful in practice.
      </p>
      <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#1a1a1a">
        <strong style="color:#014D4E">The Audit Trail</strong> keeps a complete record of every
        change made to a KLOE — who updated it, when, and what changed.
      </p>
      <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#1a1a1a">
        <strong style="color:#014D4E">Visitor access</strong> lets you grant a read-only login
        to an external reviewer without giving them editing rights.
      </p>
      <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#1a1a1a">
        <strong style="color:#014D4E">The Trend Report</strong> shows your readiness score over time.
      </p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#1a1a1a">
        <strong style="color:#014D4E">The HR module</strong> keeps staff records, training certificates,
        DBS checks, supervision logs, and appraisals in one place.
      </p>
      <p style="margin:0 0 32px">
        <a href="${PLATFORM_URL}/dashboard"
           style="display:inline-block;background-color:#014D4E;color:#ffffff;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:600;text-decoration:none">
          Explore these features &rarr;
        </a>
      </p>
    `),
    send("Your AlwaysReady trial ends in 3 days", `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${FIRST_NAME},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Your free trial ends in <strong>3 days</strong>, on ${EXPIRY_DATE}.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        If you're happy to continue, you can subscribe now for <strong>£75/month</strong>
        and keep everything exactly as it is.
      </p>
      <p style="margin:0 0 32px">
        <a href="${PLATFORM_URL}/upgrade"
           style="display:inline-block;background-color:#014D4E;color:#ffffff;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:600;text-decoration:none">
          Subscribe now &rarr;
        </a>
      </p>
    `),
    send("Your trial ends tomorrow", `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${FIRST_NAME},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Your AlwaysReady trial ends <strong>tomorrow</strong>, on ${EXPIRY_DATE}.
      </p>
      <div style="margin:0 0 16px;padding:16px 20px;background:#f5f4f1;border-left:4px solid #014D4E;border-radius:4px">
        <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#1a1a1a">
          <strong>If you'd like to continue:</strong> subscribe now for £75/month and your
          account continues without interruption.
        </p>
        <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
          <strong>If you'd like to stop:</strong> simply do nothing. Your account will be
          suspended and you will not be charged.
        </p>
      </div>
      <p style="margin:0 0 32px">
        <a href="${PLATFORM_URL}/upgrade"
           style="display:inline-block;background-color:#014D4E;color:#ffffff;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:600;text-decoration:none">
          Subscribe and continue &rarr;
        </a>
      </p>
    `),
    send("Your AlwaysReady subscription is now active", `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${FIRST_NAME},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Thank you. Your subscription is now active and your account will continue without interruption.
      </p>
      <p style="margin:0 0 32px;font-size:15px;line-height:1.7;color:#1a1a1a">
        We are delighted to have you on board. If there is anything we can do to help you
        get the most from AlwaysReady, please use the <strong>Support</strong> tab inside the platform.
      </p>
      <p style="margin:0 0 32px">
        <a href="${PLATFORM_URL}/dashboard"
           style="display:inline-block;background-color:#014D4E;color:#ffffff;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:600;text-decoration:none">
          Go to your dashboard &rarr;
        </a>
      </p>
    `),
    send("Your AlwaysReady trial has ended", `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${FIRST_NAME},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Your AlwaysReady trial ended on ${EXPIRY_DATE} and your account has now been suspended.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Your data is safe and will be retained for 30 days. If you'd like to reactivate
        your account, you can subscribe at any time.
      </p>
      <p style="margin:0 0 32px">
        <a href="${PLATFORM_URL}/upgrade"
           style="display:inline-block;background-color:#014D4E;color:#ffffff;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:600;text-decoration:none">
          Reactivate my account &rarr;
        </a>
      </p>
    `),
  ]
  const results = []
  for (const p of emails) results.push(await p)
  return results
}

async function sendOnboarding(send: Awaited<ReturnType<typeof makeSender>>) {
  const weeks: [string, string][] = [
    ['Week 1 — Welcome', `
      <p>Dear ${FIRST_NAME},</p>
      <p>Welcome to AlwaysReady. We are delighted to have you on board.</p>
      <p>This week, we would encourage you to start building your evidence base. Log in and take a look
      at your KLOE ratings. Begin with the areas where you feel least confident. Add notes, upload documents,
      and start recording the work you are doing to improve.</p>
      <p>If you have any questions, the <strong>Support</strong> tab inside the platform is the best place to reach us.</p>
    `],
    ['Week 2 — Setting up your team', `
      <p>Dear ${FIRST_NAME},</p>
      <p>This week we would like to focus on your team. You can invite staff members to AlwaysReady and assign
      them specific KLOEs to manage. Sharing responsibility means evidence is added regularly, not all at once
      before an inspection.</p>
      <p>To invite a team member, go to the <strong>Team</strong> section in the main navigation.</p>
      <p>If you have any questions, the <strong>Support</strong> tab is the best place to reach us.</p>
    `],
    ['Week 3 — Getting the most from your KLOEs', `
      <p>Dear ${FIRST_NAME},</p>
      <p>This week: tips on how to get the most from the KLOE section.</p>
      <p><strong>Start with your weakest KLOEs.</strong> Identify your lowest-rated KLOEs and begin building
      evidence against them.</p>
      <p><strong>Review the rating descriptions.</strong> Each KLOE includes CQC's own rating characteristics.</p>
      <p><strong>Add specific, dated evidence.</strong> Be as specific as you can about what you did, when,
      and what the outcome was.</p>
      <p>If you have any questions, the <strong>Support</strong> tab is the best place to reach us.</p>
    `],
    ['Week 4 — Building your evidence library', `
      <p>Dear ${FIRST_NAME},</p>
      <p>This week we focus on evidence. AlwaysReady allows you to upload documents directly against each KLOE.
      Policies, procedures, meeting minutes, training records, audits, and satisfaction surveys are all examples
      of relevant evidence.</p>
      <p><strong>Quality matters more than quantity.</strong> A small number of clear, relevant, and recent
      documents is more useful than a large outdated collection.</p>
      <p><strong>Cover all five key questions.</strong> Safe, Effective, Caring, Responsive, and Well-led.</p>
      <p>If you have any questions, the <strong>Support</strong> tab is the best place to reach us.</p>
    `],
    ['Week 5 — Have you tried the Daily Report?', `
      <p>Dear ${FIRST_NAME},</p>
      <p>The Daily Report gives you a snapshot of where your compliance stands right now. It shows which KLOEs
      are up to date, which are due for review, and which have never been assessed.</p>
      <p>We would encourage you to make it part of your daily routine. Even a five-minute check each morning
      can make a significant difference to how prepared you feel over time.</p>
      <p>If you have any questions, the <strong>Support</strong> tab is the best place to reach us.</p>
    `],
    ['Week 6 — Your audit trail', `
      <p>Dear ${FIRST_NAME},</p>
      <p>Every change made in AlwaysReady is recorded — who made the change and when. This matters because
      CQC inspectors are interested not just in where you are now, but in the journey you have been on.</p>
      <p>If you have any questions, the <strong>Support</strong> tab is the best place to reach us.</p>
    `],
    ['Week 7 — Sharing access with external visitors', `
      <p>Dear ${FIRST_NAME},</p>
      <p>AlwaysReady allows you to create a time-limited visitor login for external reviewers. The visitor
      can view your KLOE ratings and evidence without being able to make any changes.</p>
      <p>To set up a visitor login, go to the <strong>Team</strong> section in the main navigation.</p>
      <p>If you have any questions, the <strong>Support</strong> tab is the best place to reach us.</p>
    `],
    ['Week 8 — Track your progress with the Trend Report', `
      <p>Dear ${FIRST_NAME},</p>
      <p>The Trend Report shows how your KLOE ratings have changed since you started using AlwaysReady.
      It gives you something concrete to share with your board, your local authority, or a CQC inspector.</p>
      <p>If you have any questions, the <strong>Support</strong> tab is the best place to reach us.</p>
    `],
    ['Week 9 — The HR module', `
      <p>Dear ${FIRST_NAME},</p>
      <p>The HR module helps you keep your staff records in order — DBS checks, right to work documentation,
      training records, supervision and appraisal history, and employment status.</p>
      <p><strong>Check that all staff records are complete.</strong> Look for gaps in DBS checks, training
      certificates, or supervision dates.</p>
      <p>If you have any questions, the <strong>Support</strong> tab is the best place to reach us.</p>
    `],
    ['Week 10 — How AlwaysReady keeps your data safe', `
      <p>Dear ${FIRST_NAME},</p>
      <p>We understand that the information you enter is sensitive. Here is what we do to keep your data safe.</p>
      <ul style="margin:0 0 16px;padding-left:20px;line-height:1.8">
        <li>All data is encrypted at rest and in transit.</li>
        <li>Every file is scanned for viruses before it is stored.</li>
        <li>Your data is held within the European Union.</li>
        <li>Each organisation's data is completely isolated from all others.</li>
      </ul>
      <p>If you have any questions, the <strong>Support</strong> tab is the best place to reach us.</p>
    `],
    ['Week 11 — Your data, your rights', `
      <p>Dear ${FIRST_NAME},</p>
      <p>Under the UK GDPR, individuals whose personal data is held within AlwaysReady have the right to
      access their data, request correction, request deletion in certain circumstances, and object to
      certain types of processing.</p>
      <p>As the data controller, your organisation is responsible for handling these requests from your staff.
      General guidance is available at <a href="https://ico.org.uk" style="color:#014D4E">ico.org.uk</a>.</p>
      <p>If you have any questions, the <strong>Support</strong> tab is the best place to reach us.</p>
    `],
    ["Week 12 — Thank you, and what's next", `
      <p>Dear ${FIRST_NAME},</p>
      <p>Twelve weeks ago you started your AlwaysReady journey. We hope the platform has become a useful part
      of how you manage your compliance.</p>
      <p>The care providers who fare best in CQC inspections make compliance part of their everyday routine.
      You are already doing that. Keep going.</p>
      <ul style="margin:0 0 16px;padding-left:20px;line-height:1.8">
        <li>Continue reviewing your lowest-rated KLOEs and building evidence against them.</li>
        <li>Keep your HR records current — especially DBS renewals and training certificates.</li>
        <li>Use the Trend Report each month to measure your progress.</li>
      </ul>
      <p>Thank you for being an AlwaysReady customer. We are glad you are here.</p>
    `],
  ]

  const results = []
  for (const [subject, bodyHtml] of weeks) {
    results.push(await send(`[Onboarding] ${subject}`, `${bodyHtml}
      <p style="margin:32px 0 0">
        <a href="${PLATFORM_URL}/dashboard"
           style="display:inline-block;background-color:#014D4E;color:#ffffff;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:600;text-decoration:none">
          Go to your dashboard &rarr;
        </a>
      </p>
    `, 'marketing'))
  }
  return results
}

async function sendSupport(send: Awaited<ReturnType<typeof makeSender>>) {
  return Promise.all([
    send(`We've received your support request — ${REF}`, `
      <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">Hi ${FIRST_NAME},</p>
      <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Thank you for getting in touch. We've received your support request and will get back to you as soon as possible.
      </p>
      <div style="margin:0 0 24px;padding:16px 20px;background:#f5f4f1;border-left:4px solid #014D4E;border-radius:4px">
        <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:0.05em">Your request</p>
        <p style="margin:0 0 4px;font-size:13px;color:#888;font-family:monospace">${REF}</p>
        <p style="margin:0;font-size:15px;font-weight:600;color:#1a1a1a">Unable to upload evidence documents</p>
      </div>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#555">
        Please do not reply to this email — all correspondence should go through the support desk inside the platform.
      </p>
    `),
    send(`Re: Unable to upload evidence documents [${REF}]`, `
      <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${FIRST_NAME},</p>
      <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Thank you for getting in touch. Here is our response to your enquiry:
      </p>
      <div style="margin:0 0 24px;padding:16px 20px;background:#f5f4f1;border-left:4px solid #014D4E;border-radius:4px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Evidence uploads accept .docx and .xlsx files only. Please ensure your document is saved in one of
        these formats before uploading. If the issue persists, please let us know the file type you are trying
        to upload and we will look into it further.
      </div>
    `),
    send(`Your support request has been resolved [${REF}]`, `
      <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">Hi ${FIRST_NAME},</p>
      <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">
        We're getting in touch to let you know that your support request has been marked as resolved.
      </p>
      <div style="margin:0 0 24px;padding:16px 20px;background:#f5f4f1;border-left:4px solid #014D4E;border-radius:4px">
        <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:0.05em">Resolved request</p>
        <p style="margin:0 0 4px;font-size:13px;color:#888;font-family:monospace">${REF}</p>
        <p style="margin:0;font-size:15px;font-weight:600;color:#1a1a1a">Unable to upload evidence documents</p>
      </div>
      <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">
        If your issue has not been fully resolved, please open a new support ticket from the
        <strong>Support</strong> section inside the platform.
      </p>
    `),
  ])
}

async function sendKloe(send: Awaited<ReturnType<typeof makeSender>>) {
  return Promise.all([
    send(`You've been assigned a KLOE — ${KLOE_TITLE}`, `
      <p style="margin:0 0 16px">Hi ${FIRST_NAME},</p>
      <p style="margin:0 0 16px">You've been assigned a KLOE that needs your attention:</p>
      <p style="margin:0 0 24px;padding:16px 20px;background:#f0fdfb;border-left:4px solid #00b8a6;border-radius:4px;font-weight:600;color:#014D4E">
        ${KLOE_TITLE}
      </p>
      <p style="margin:0 0 24px">Log in to AlwaysReady to review the checklist, gather evidence, and update your progress.</p>
      <p style="margin:0 0 32px">
        <a href="${PLATFORM_URL}/dashboard/kloes"
           style="display:inline-block;background:#014D4E;color:#ffffff;font-weight:600;font-size:15px;padding:12px 24px;border-radius:6px;text-decoration:none">
          View KLOE &rarr;
        </a>
      </p>
    `),
    send(`KLOE review due in 7 days — ${KLOE_TITLE}`, `
      <p style="margin:0 0 16px">Hi,</p>
      <p style="margin:0 0 16px">This is a reminder that your KLOE review is due in <strong>7 days</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:0 0 24px">
        <tr>
          <td style="padding:12px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px">
            <p style="margin:0 0 4px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em">KLOE</p>
            <p style="margin:0;font-weight:600;color:#1a1a1a">${KLOE_TITLE}</p>
            <p style="margin:4px 0 0;font-size:13px;color:#4b5563">Due: 14 September 2025</p>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 24px">
        <a href="${PLATFORM_URL}/dashboard/kloes" style="display:inline-block;background:#014D4E;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px">
          Go to KLOE tracker &rarr;
        </a>
      </p>
    `),
    send(`Overdue KLOE review — ${KLOE_TITLE}`, `
      <p style="margin:0 0 16px">Hi,</p>
      <p style="margin:0 0 16px">A KLOE review is now <strong style="color:#dc2626">overdue</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:0 0 24px">
        <tr>
          <td style="padding:12px 16px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px">
            <p style="margin:0 0 4px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em">KLOE</p>
            <p style="margin:0;font-weight:600;color:#1a1a1a">${KLOE_TITLE}</p>
            <p style="margin:4px 0 0;font-size:13px;color:#dc2626">Was due: 1 August 2025</p>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 24px">
        <a href="${PLATFORM_URL}/dashboard/kloes" style="display:inline-block;background:#014D4E;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px">
          Go to KLOE tracker &rarr;
        </a>
      </p>
    `),
  ])
}

async function sendHr(send: Awaited<ReturnType<typeof makeSender>>) {
  return Promise.all([
    send(`${STAFF_NAME} — DBS Check due in 30 days`, `
      <p style="margin:0 0 16px">Hi,</p>
      <p style="margin:0 0 16px">An HR review is due in <strong>30 days</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:0 0 24px">
        <tr>
          <td style="padding:12px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px">
            <p style="margin:0 0 4px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em">Staff member</p>
            <p style="margin:0;font-weight:600;color:#1a1a1a">${STAFF_NAME}</p>
            <p style="margin:4px 0 0;font-size:13px;color:#4b5563">DBS Check — due 14 September 2025</p>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 24px">
        <a href="${PLATFORM_URL}/dashboard/hr" style="display:inline-block;background:#014D4E;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px">
          Go to HR module &rarr;
        </a>
      </p>
    `),
    send(`${STAFF_NAME} — DBS Check is overdue`, `
      <p style="margin:0 0 16px">Hi,</p>
      <p style="margin:0 0 16px">An HR review is now <strong style="color:#dc2626">overdue</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:0 0 24px">
        <tr>
          <td style="padding:12px 16px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px">
            <p style="margin:0 0 4px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em">Staff member</p>
            <p style="margin:0;font-weight:600;color:#1a1a1a">${STAFF_NAME}</p>
            <p style="margin:4px 0 0;font-size:13px;color:#dc2626">DBS Check — was due 1 August 2025</p>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 24px">
        <a href="${PLATFORM_URL}/dashboard/hr" style="display:inline-block;background:#014D4E;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px">
          Go to HR module &rarr;
        </a>
      </p>
    `),
  ])
}

async function sendAccount(send: Awaited<ReturnType<typeof makeSender>>) {
  return Promise.all([
    send('Reset your AlwaysReady password', `
      <p>We received a request to reset the password for your AlwaysReady account.</p>
      <p style="color:#555;font-size:14px">Click the button below to set a new password. This link expires in 1 hour.</p>
      <p>
        <a href="${PLATFORM_URL}/account/reset?token=EXAMPLE_TOKEN"
           style="display:inline-block;background:#014D4E;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px">
          Reset my password
        </a>
      </p>
      <p style="font-size:12px;color:#999;margin-top:24px">
        If you didn't request this, you can safely ignore this email. Your password will not change.
      </p>
    `),
    send('Your AlwaysReady password has been changed', `
      <p>Your AlwaysReady password was successfully changed.</p>
      <p style="color:#555;font-size:14px">If you made this change, there is nothing further for you to do.
      If it wasn't you, please change your password immediately or contact your administrator.</p>
    `),
    send('Welcome to AlwaysReady — your login details', `
      <p style="margin:0 0 16px">Hi ${FIRST_NAME},</p>
      <p style="margin:0 0 16px">
        Welcome to the AlwaysReady Beta. Your account for <strong>${ORG_NAME}</strong> is ready.
      </p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0"
        style="background:#f5f5f0;border-radius:6px;padding:20px 24px;margin:0 0 24px;width:100%">
        <tr>
          <td style="font-size:14px;line-height:2">
            <strong>Login URL:</strong>
            <a href="${PLATFORM_URL}/login" style="color:#014D4E">${PLATFORM_URL}/login</a><br>
            <strong>Email:</strong> sarah.jones@sunrisecareuk.co.uk<br>
            <strong>Password:</strong> Temp#2025Secure<br>
            <strong>Trial expires:</strong> ${EXPIRY_DATE}
          </td>
        </tr>
      </table>
      <p style="margin:0 0 16px;background:#fef9ec;border-left:4px solid #ffd700;padding:12px 16px;border-radius:4px;font-size:14px;color:#1a1a1a">
        <strong>We highly recommend changing your password the first time you log in.</strong>
        You can do this from <strong>Account &rarr; Security &rarr; Change password</strong>.
      </p>
    `),
  ])
}

// ── Public action ─────────────────────────────────────────────────────────────

export async function sendTestEmailGroup(group: EmailGroup): Promise<TestEmailsSummary> {
  await assertSuperadmin()

  const to   = process.env.SUPERADMIN_EMAIL!
  const send = await makeSender(to)

  let results: TestEmailResult[]

  switch (group) {
    case 'website':    results = await sendWebsite(send);   break
    case 'trial':      results = await sendTrial(send);     break
    case 'onboarding': results = await sendOnboarding(send); break
    case 'support':    results = await sendSupport(send);   break
    case 'kloe':       results = await sendKloe(send);      break
    case 'hr':         results = await sendHr(send);        break
    case 'account':    results = await sendAccount(send);   break
    case 'all': {
      const grouped = await Promise.all([
        sendWebsite(send),
        sendTrial(send),
        sendOnboarding(send),
        sendSupport(send),
        sendKloe(send),
        sendHr(send),
        sendAccount(send),
      ])
      results = grouped.flat()
      break
    }
  }

  return {
    count:  results.length,
    sent:   results.filter(r => r.sent).length,
    failed: results.filter(r => !r.sent),
    results,
  }
}
