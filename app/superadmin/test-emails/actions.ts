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
    // For marketing emails, pass subscriberEmail so the opt-out DB check is
    // skipped (no userId exists for the superadmin test recipient) while still
    // rendering the unsubscribe footer as a real recipient would see it.
    const r = await sendEmail({
      to,
      subject: `[TEST] ${subject}`,
      bodyHtml,
      type,
      ...(type === 'marketing' ? { subscriberEmail: to } : {}),
    })
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
    send("[Day 0] Your AlwaysReady trial is ready — set your password to get started", `
      <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${FIRST_NAME},</p>
      <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Your 14-day free trial of AlwaysReady is ready. Click the button below to
        set your password and get straight into your account.
      </p>
      <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">
        <strong style="color:#014D4E">${ORG_NAME}</strong> has been configured to your
        service type using the CQC Adult Social Care Assessment Framework. You can start
        recording your compliance position, uploading evidence, and building your
        inspection readiness straight away.
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
        the platform and we will get back to you shortly.
      </p>
    `),
    send("[Day 1] Welcome to AlwaysReady", `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${FIRST_NAME},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Welcome to AlwaysReady. Your 14-day free trial is now active and your account is ready to use.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        AlwaysReady is designed to help adult social care providers prepare for a CQC inspection with confidence.
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
    send("[Day 3] A question worth thinking about", `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${FIRST_NAME},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        The managers who feel most prepared for inspection are those who build their evidence
        continuously, not in a rush when pressure hits.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        If you haven't had a chance to log in yet, here's the best place to start:
      </p>
      <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#1a1a1a">
        <strong style="color:#014D4E">Rate your KLOEs.</strong> Your KLOE tracker is pre-loaded
        with every Key Line of Enquiry for your service type. Work through them and mark how each
        area is looking right now — it gives you a clearer picture of where you stand.
      </p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#1a1a1a">
        <strong style="color:#014D4E">Upload one piece of evidence per KLOE.</strong> A policy,
        an audit, a training record — anything relevant. Even a single document per KLOE starts
        to build the evidence base an inspector will want to see.
      </p>
      <p style="margin:0 0 32px">
        <a href="${PLATFORM_URL}/dashboard/kloes"
           style="display:inline-block;background-color:#014D4E;color:#ffffff;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:600;text-decoration:none">
          Go to your KLOE tracker &rarr;
        </a>
      </p>
    `),
    send("[Day 5] How are you getting on?", `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${FIRST_NAME},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        You're five days into your AlwaysReady trial. We hope you've had a chance to start
        exploring — here are a few things worth doing before the halfway point.
      </p>
      <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#1a1a1a">
        <strong style="color:#014D4E">Build your team</strong><br>
        AlwaysReady works best when responsibility is shared. You can invite colleagues under
        <strong>Account &rarr; Team</strong> and assign them specific KLOEs to manage. Shared
        ownership means evidence gets added regularly, not all at once before an inspection.
      </p>
      <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#1a1a1a">
        <strong style="color:#014D4E">Assign your KLOEs</strong><br>
        Head to your KLOE tracker and assign individual KLOEs to the team members best placed
        to manage them. Each person will receive an email notification and can log in to update
        their progress directly.
      </p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#1a1a1a">
        <strong style="color:#014D4E">Set review dates</strong><br>
        KLOEs can have a scheduled review date. Setting these now means the platform will send
        automatic reminders when a review is approaching or overdue — keeping your readiness
        position current without you having to remember.
      </p>
      <p style="margin:0 0 32px">
        <a href="${PLATFORM_URL}/dashboard"
           style="display:inline-block;background-color:#014D4E;color:#ffffff;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:600;text-decoration:none">
          Go to your dashboard &rarr;
        </a>
      </p>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#555">
        If you have questions about any of these features, the <strong>Help</strong> tab covers
        the most common questions by role, and <strong>Support</strong> lets you reach us directly.
      </p>
    `),
    send("[Day 7] You're halfway through your trial — here's a quick checklist", `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${FIRST_NAME},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        You have 7 days remaining on your AlwaysReady trial — you're at the halfway point.
      </p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#1a1a1a">
        You've already made a start — well done. Here's a summary of what you've done and
        what's still worth exploring before your trial ends.
      </p>
      <table style="width:100%;border-collapse:collapse;margin:0 0 28px">
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;vertical-align:top;width:28px">
            <span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:#00b8a6;color:#fff;font-size:12px;font-weight:700;line-height:1">✓</span>
          </td>
          <td style="padding:10px 0 10px 12px;border-bottom:1px solid #f0f0f0">
            <span style="font-size:15px;color:#9ca3af;text-decoration:line-through">Rate your KLOEs</span>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;vertical-align:top;width:28px">
            <span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:#00b8a6;color:#fff;font-size:12px;font-weight:700;line-height:1">✓</span>
          </td>
          <td style="padding:10px 0 10px 12px;border-bottom:1px solid #f0f0f0">
            <span style="font-size:15px;color:#9ca3af;text-decoration:line-through">Upload your first evidence</span>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;vertical-align:top;width:28px">
            <span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;border:2px solid #014D4E"></span>
          </td>
          <td style="padding:10px 0 10px 12px;border-bottom:1px solid #f0f0f0">
            <span style="font-size:15px;font-weight:600;color:#1a1a1a">Invite a team member</span><br>
            <span style="font-size:13px;color:#6b7280;line-height:1.5">Give a colleague their own login under Account &rarr; Team —
              <a href="${PLATFORM_URL}/dashboard/account?tab=team" style="color:#014D4E;font-weight:600">Go there now &rarr;</a>
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;vertical-align:top;width:28px">
            <span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;border:2px solid #014D4E"></span>
          </td>
          <td style="padding:10px 0 10px 12px;border-bottom:1px solid #f0f0f0">
            <span style="font-size:15px;font-weight:600;color:#1a1a1a">Add a staff record</span><br>
            <span style="font-size:13px;color:#6b7280;line-height:1.5">Create your first HR profile to explore the HR module —
              <a href="${PLATFORM_URL}/dashboard/hr" style="color:#014D4E;font-weight:600">Go there now &rarr;</a>
            </span>
          </td>
        </tr>
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
    `),
    send("[Day 9] A few things you might not have tried yet", `
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
    send("[Day 11] Your AlwaysReady trial ends in 3 days", `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${FIRST_NAME},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Your trial ends in <strong>3 days</strong>, on ${EXPIRY_DATE}. Before you decide,
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
            <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#1a1a1a">
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
            <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#1a1a1a">
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
            <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#1a1a1a">
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
            <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#1a1a1a">
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
        without interruption when you subscribe for <strong>£75/month</strong>.
        Your KLOEs, evidence, HR records, and team settings stay exactly as they are.
      </p>
      <p style="margin:0 0 32px">
        <a href="${PLATFORM_URL}/upgrade"
           style="display:inline-block;background-color:#014D4E;color:#ffffff;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:600;text-decoration:none">
          Subscribe now &rarr;
        </a>
      </p>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#555">
        If you have any questions before you decide, the <strong>Support</strong> tab inside
        the platform is the best place to reach us.
      </p>
    `),
    send("[Day 13] Your trial ends tomorrow", `
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
    send("[Day 14a — Subscribed] Your AlwaysReady subscription is now active", `
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
    send("[Day 14b — Lapsed] Your AlwaysReady trial has ended", `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${FIRST_NAME},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Your AlwaysReady trial ended on ${EXPIRY_DATE}. Your data is safe and will be
        retained by us for 30 days. To regain access to the AlwaysReady platform,
        click the <strong>Subscribe</strong> button below at any time — everything
        will be exactly as you left it.
      </p>
      <p style="margin:0 0 32px">
        <a href="${PLATFORM_URL}/upgrade"
           style="display:inline-block;background-color:#014D4E;color:#ffffff;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:600;text-decoration:none">
          Subscribe now &rarr;
        </a>
      </p>
    `),
    // ── User role emails (sent based on days since user joined — separate to admin trial sequence) ──
    send("[User — Day 1] Welcome to AlwaysReady — here's how to get started", `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${STAFF_NAME.split(' ')[0]},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        You've been added to <strong>${ORG_NAME}</strong>'s AlwaysReady account.
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
      <p style="margin:0;font-size:14px;line-height:1.6;color:#555">
        If you have any questions, use the <strong>Help</strong> tab for guidance by role, or
        the <strong>Support</strong> tab to reach our team directly.
      </p>
    `),
    send("[User — Day 7] A quick check-in on your KLOEs", `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${STAFF_NAME.split(' ')[0]},</p>
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
      <p style="margin:0;font-size:14px;line-height:1.6;color:#555">
        If you're not sure what's expected of you, the <strong>Help</strong> tab inside the
        platform covers the most common questions by role.
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
      <p>Welcome to AlwaysReady — we're delighted to have you on board ⭐</p>
      <p>This week, we encourage you to begin building your evidence base straight away. A great first step
      is to identify the KLOEs you feel least confident with. Choose one KLOE to focus on and outline your
      next steps. You can add notes, upload documents, and start recording your actions as you go.</p>
      <p>This early activity is incredibly valuable — it shows CQC that you've recognised an area for
      improvement and taken clear, proactive steps to address it.</p>
      <p>If you need any help along the way, the <strong>Support</strong> tab inside the platform is the best place to reach us.</p>
    `],
    ['Week 2 — Setting up your team', `
      <p>Dear ${FIRST_NAME},</p>
      <p>This week, we focus on setting up your team on the platform ⭐</p>
      <p>You can invite staff members into AlwaysReady. You can also assign them specific KLOEs to manage.
      When everyone contributes, evidence is added steadily over time. This prevents the last-minute rush
      that often happens before an inspection.</p>
      <p>Sharing the workload also helps your team become more inspection-ready. As staff take ownership of
      their KLOEs, they learn what good governance looks like. They become more confident with compliance
      expectations. They also feel more prepared to talk to inspectors about the work they've done.</p>
      <p>Over time, this builds a stronger culture of everyday governance. It means compliance becomes part
      of normal practice, not something that only happens when an inspection is due.</p>
      <p>To invite a team member, go to the <strong>Team</strong> section in the main navigation.</p>
      <p>If you need any help, the <strong>Support</strong> tab is the best place to reach us.</p>
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
    // Avoid Resend rate limits when sending 12 emails in quick succession during testing
    await new Promise(resolve => setTimeout(resolve, 600))
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
      <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
        You can reply to this email directly, or visit the <strong>Support</strong> section
        inside AlwaysReady to view your request and any replies.
      </p>
    `),
    send(`Re: Unable to upload evidence documents [${REF}]`, `
      <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${FIRST_NAME},</p>
      <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Thank you for getting in touch. Here is our response to your enquiry:
      </p>
      <div style="margin:0 0 24px;padding:16px 20px;background:#f5f4f1;border-left:4px solid #014D4E;border-radius:4px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Evidence uploads accept .pdf, .docx, .xlsx, .jpg, .jpeg, and .png files. Please ensure your document
        is saved in one of these formats before uploading. If the issue persists, please let us know the file
        type you are trying to upload and we will look into it further.
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
      <p style="margin:0 0 24px">Log in to AlwaysReady to review the KLOE(s) you have been assigned, upload evidence, and update your progress.</p>
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
      <p style="margin:0 0 16px"><strong>${STAFF_NAME}</strong>'s <strong>DBS Check</strong> is due in <strong>30 days</strong>.</p>
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
        Welcome to AlwaysReady. Your account for <strong>${ORG_NAME}</strong> is ready.
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
      <p style="margin:0 0 16px;background:#fef9ec;border-left:4px solid #ffd700;padding:12px 16px;border-radius:4px;font-size:14px;color:#1a1a1a;line-height:1.7">
        <strong>A note on security</strong><br>
        AlwaysReady holds your service's compliance records, evidence documents, and staff data.
        This is sensitive information, and we take the security of your account seriously.<br><br>
        Before you do anything else, please complete these two steps:<br><br>
        1. <strong>Change your password</strong> — replace the temporary password above with one
        that is unique to you. Go to <strong>Account &rarr; Security &rarr; Change password</strong>.<br>
        2. <strong>Set up two-factor authentication (MFA)</strong> — the platform will prompt you
        to do this automatically when you first log in. MFA means that even if your password were
        ever compromised, your account cannot be accessed without a second verification step on
        your phone or authenticator app.
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
