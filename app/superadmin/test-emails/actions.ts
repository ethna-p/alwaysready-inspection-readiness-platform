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
  | 'waitlist'
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
        Drop us a message through the <strong>Support</strong> tab whenever you need us.
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
        You'll always find us in the <strong>Support</strong> tab.
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
      <p>This week: getting the most from your KLOE section ⭐</p>
      <p><strong>Start with your weakest KLOEs</strong><br>
      Begin with the KLOEs you feel least confident about. These areas usually need the most attention, so
      improving them early has the biggest impact. It also shows CQC that you can spot gaps and take action
      straight away.</p>
      <p><strong>Review the rating descriptions</strong><br>
      Each KLOE includes CQC's rating characteristics. These tell you exactly what 'Good' and 'Outstanding'
      look like. Use them as a checklist to understand what you already do well and what needs strengthening.</p>
      <p><strong>Add specific, dated evidence</strong><br>
      Record what happened, when it happened, and what the outcome was. Add documents, notes, or examples of
      practice. Clear, dated evidence helps inspectors see your progress and understand your decision-making.</p>
      <p><strong>Update little and often</strong><br>
      Small, regular updates keep you inspection-ready all year round. They also make it easier to track
      improvements and spot gaps early.</p>
      <p>Got a question? The <strong>Support</strong> tab is where to find us.</p>
    `],
    ['Week 4 — Building your evidence library', `
      <p>Dear ${FIRST_NAME},</p>
      <p>This week we're focusing on evidence ⭐</p>
      <p><strong>Upload evidence directly to each KLOE</strong><br>
      AlwaysReady lets you upload documents straight into the KLOE they relate to. This keeps everything organised
      and easy to find. Policies, procedures, meeting minutes, training records, audits, and satisfaction surveys
      are all useful examples. You can also add notes, screenshots, action plans, and examples of day-to-day practice.
      The goal is to build a clear picture of how your service works and how you make decisions.</p>
      <p><strong>Quality matters more than quantity</strong><br>
      A small number of strong, relevant documents is far more valuable than a large collection of outdated files.
      Inspectors want to see evidence that reflects your current practice. Choose documents that show what you do,
      why you do it, and how it improves care. Clear, recent evidence helps demonstrate good governance and makes
      your inspection smoother.</p>
      <p><strong>Cover all five key questions</strong><br>
      Make sure your evidence reflects all five areas: Safe, Effective, Caring, Responsive, and Well-led. Each key
      question tells part of your story. Together, they show how your service protects people, supports them well,
      listens to their needs, adapts to change, and leads with strong governance. Balanced evidence across all five
      areas helps inspectors understand your service as a whole.</p>
      <p><strong>Add dates, outcomes, and context</strong><br>
      Whenever you upload evidence, include a short note explaining what happened, when it happened, and what the
      outcome was. This helps inspectors follow the journey from issue to action to improvement. It also shows that
      your governance processes are active, not passive.</p>
      <p>We're here whenever you need us — just head to the <strong>Support</strong> tab.</p>
    `],
    ['Week 5 — Have you tried the Daily Report?', `
      <p>Dear ${FIRST_NAME},</p>
      <p>This week we're focusing on your Daily Report ⭐</p>
      <p><strong>Understand your current compliance position</strong><br>
      The Daily Report gives you a real-time snapshot of where your compliance stands today. It shows which KLOEs
      are up to date, which need reviewing, and which have never been assessed. This helps you see your strengths
      and your gaps at a glance. It also gives you a clear starting point for what to focus on next.</p>
      <p><strong>Use it to guide your daily actions</strong><br>
      We encourage you to make the Daily Report part of your everyday routine. Even a quick five-minute check each
      morning helps you stay aware of what needs attention. Over time, these small daily check-ins build strong
      habits. They also reduce the pressure that comes from trying to prepare everything right before an inspection.</p>
      <p><strong>Spot issues early and act quickly</strong><br>
      By reviewing your Daily Report regularly, you can identify gaps before they become risks. You'll see where
      evidence is missing, where updates are overdue, and where improvements are needed. Early action is one of the
      strongest indicators of good governance. It shows CQC that you monitor your service actively and respond promptly.</p>
      <p><strong>Build confidence across your team</strong><br>
      When the Daily Report becomes part of your routine, your whole team benefits. Everyone knows what's expected.
      Everyone can see progress. And everyone feels more prepared for conversations with inspectors. This creates a
      culture where compliance is continuous, not occasional.</p>
      <p>Head over to the <strong>Support</strong> tab if you have any questions.</p>
    `],
    ['Week 6 — Your audit trail', `
      <p>Dear ${FIRST_NAME},</p>
      <p>This week we're focusing on your audit trail ⭐</p>
      <p><strong>Every change is recorded</strong><br>
      Every update you make in AlwaysReady is automatically logged. The system records who made the change,
      what was updated, and when it happened. This creates a clear, reliable audit trail. It shows how your
      service thinks, responds, and improves over time. It also helps you track progress, understand
      decision-making, and see how actions link to outcomes.</p>
      <p><strong>Your journey matters to CQC</strong><br>
      CQC inspectors are interested in more than your current position. They want to understand the journey
      you've been on. They look for evidence that you identify issues, take action, and follow through. A
      detailed audit trail shows that your governance is active, not reactive. It demonstrates that improvements
      are intentional, recorded, and part of everyday practice.</p>
      <p><strong>Show continuous improvement</strong><br>
      When inspectors can see a timeline of changes, it becomes clear how your service learns and adapts. Small
      updates, regular reviews, and steady improvements all build a strong narrative. This helps you evidence
      compliance, leadership, and responsiveness. It also shows that your team works together to maintain
      high standards.</p>
      <p><strong>Strengthen accountability and transparency</strong><br>
      A clear record of who made each change supports good governance. It encourages shared responsibility and
      helps everyone understand their role. It also gives managers confidence that actions are being taken and
      recorded properly. Transparency is one of the strongest indicators of a well-led service.</p>
      <p>You know the drill by now. Questions? Head over to the <strong>Support</strong> tab.</p>
    `],
    ['Week 7 — Sharing access with external visitors', `
      <p>Dear ${FIRST_NAME},</p>
      <p>This week we're focusing on visitor access ⭐</p>
      <p><strong>Create secure, time-limited visitor logins</strong><br>
      AlwaysReady lets you create a secure, time-limited visitor login for external reviewers. Visitors can
      view your KLOE ratings and evidence, but they cannot make any changes. This keeps your records accurate
      and protected.</p>
      <p><strong>Ideal for CQC inspectors</strong><br>
      Viewer logins are especially helpful during a CQC inspection. Inspectors can access the information they
      need quickly and see your evidence exactly as you've organised it. This makes inspections smoother and
      shows confidence in your governance.</p>
      <p><strong>Useful for audits and peer reviews</strong><br>
      You can also use visitor access for consultants, peer reviewers, and quality assurance partners. They can
      review your compliance position directly and offer focused feedback, while you stay fully in control of
      who sees what and for how long.</p>
      <p><strong>Easy to set up</strong><br>
      To create a visitor login, go to the <strong>Team</strong> section in the main navigation. Set the access
      period, send the login, and revoke it whenever you choose.</p>
      <p>The <strong>Support</strong> tab is there whenever you need a hand.</p>
    `],
    ['Week 8 — Track your progress with the Trend Report', `
      <p>Dear ${FIRST_NAME},</p>
      <p>This week we're focusing on your Trend Report ⭐</p>
      <p><strong>See how your compliance has evolved</strong><br>
      The Trend Report shows how your KLOE ratings have changed over time. It highlights improvements, dips,
      and areas where your work has remained consistent. This gives you a clear picture of your journey since
      you started using AlwaysReady. It helps you understand not just where you are today, but how you got there.</p>
      <p><strong>Turn progress into evidence</strong><br>
      Trend data is powerful because it shows movement. Inspectors and stakeholders want to see that you identify
      issues, take action, and follow through. The Trend Report gives you concrete evidence of that process. It
      shows that your governance is active, ongoing, and responsive.</p>
      <p><strong>Share meaningful insights with stakeholders</strong><br>
      You can use the Trend Report to update your board, your local authority, or a CQC inspector. It provides
      a simple, visual way to demonstrate improvement and highlight areas that still need attention. This makes
      conversations clearer, more focused, and more productive. It also shows that you monitor your service proactively.</p>
      <p><strong>Strengthen your inspection narrative</strong><br>
      During an inspection, inspectors want to understand your story. The Trend Report helps you explain what has
      changed, why it changed, and what you're doing next. It supports a confident, evidence-based narrative that
      reflects continuous improvement.</p>
      <p>Any questions at all? The <strong>Support</strong> tab is the quickest way to reach us.</p>
    `],
    ['Week 9 — The HR module', `
      <p>Dear ${FIRST_NAME},</p>
      <p>This week we're focusing on your HR module ⭐</p>
      <p><strong>Keep essential staff records organised</strong><br>
      The HR module stores all key workforce documents in one place — DBS checks, right-to-work evidence,
      training records, supervision and appraisal history, and employment status. Centralising these records
      makes it easier to monitor compliance and respond quickly to inspectors or commissioners.</p>
      <p><strong>Check every record is complete</strong><br>
      Review each staff profile and look for gaps. Missing DBS checks, expired training certificates, or
      overdue supervision dates can affect your Safe and Well-led ratings. Completing these records strengthens
      safeguarding and shows you actively monitor workforce compliance.</p>
      <p><strong>Automated reminders and leave calculations</strong><br>
      The system sends automatic reminders to staff when their training is due, helping you stay ahead of
      expiry dates. It also calculates annual leave in both days and hours, making workforce planning clearer
      and reducing admin time.</p>
      <p><strong>Support inspection readiness</strong><br>
      CQC often asks for proof of training, DBS status, and supervision frequency. With the HR module, you
      can provide this instantly. Clear, up-to-date records help demonstrate a well-managed, well-supported team.</p>
      <p>As always, if anything comes up, the <strong>Support</strong> tab is the best place to get in touch.</p>
    `],
    ['Week 10 — How AlwaysReady keeps your data safe', `
      <p>Dear ${FIRST_NAME},</p>
      <p>This week we're focusing on data security ⭐</p>
      <p><strong>Your information is handled with care</strong><br>
      We understand that the information you enter into AlwaysReady is sensitive. Protecting it is central to
      how the platform is built. Every upload, update, and record is stored using modern security standards
      designed to keep your data safe at all times.</p>
      <p><strong>Your data is encrypted at all times</strong><br>
      All data is encrypted at rest and in transit. This means your information is protected when it's stored
      and when it's moving between your device and our servers. Encryption ensures that even if data were
      intercepted, it would be unreadable.</p>
      <p><strong>Every file is scanned before storage</strong><br>
      Every document you upload is automatically scanned for viruses and malicious content. This prevents
      harmful files from entering the system and protects your organisation's devices and records.</p>
      <p><strong>Your data is stored securely</strong><br>
      All data is stored securely and we are committed to full compliance with UK GDPR. Your information is
      never transferred outside the European Economic Area, and benefits from the data protection standards
      that apply within it.</p>
      <p><strong>Strong access controls: MFA and password security</strong><br>
      Security isn't only about where your data is stored — it's also about who can access it. AlwaysReady
      supports multi-factor authentication (MFA), which adds an extra layer of protection beyond your password.
      Even if someone guessed or stole a password, MFA prevents them from logging in. We also encourage strong
      password practices: unique passwords, regular updates, and avoiding shared logins. These small habits make
      a big difference to your overall security.</p>
      <p><strong>Designed for safety, transparency, and control</strong><br>
      All of these protections work together to ensure your information is secure, traceable, and fully under
      your control. You can confidently upload evidence, staff records, and governance documents knowing they
      are protected at every stage.</p>
      <p>Questions? We're always happy to help — find us in the <strong>Support</strong> tab.</p>
    `],
    ['Week 11 — Your data, your rights', `
      <p>Dear ${FIRST_NAME},</p>
      <p>This week we're focusing on data rights and responsibilities ⭐</p>
      <p><strong>People have rights over their personal data</strong><br>
      Under the UK GDPR, anyone whose personal information is stored in AlwaysReady has important rights. They
      can access the data you hold about them, ask for corrections, request deletion in certain circumstances,
      and object to certain types of processing. These rights are designed to give individuals confidence and
      control over how their information is used.</p>
      <p><strong>Your organisation is the data controller</strong><br>
      Your organisation decides what personal data is collected, why it's collected, and how it's used. That
      means you are the data controller. You are responsible for responding to staff requests about their data
      and making sure those requests are handled correctly and on time.</p>
      <p><strong>AlwaysReady is the data processor</strong><br>
      AlwaysReady acts as a data processor. This means we process data on your behalf, following your
      instructions. We keep the platform secure, ensure data is stored safely, and provide the tools you need
      to manage information — but we do not decide how your staff data is used. That responsibility stays
      with your organisation.</p>
      <p><strong>Clear guidance is available</strong><br>
      If you're ever unsure how to respond to a data-rights request, the ICO provides straightforward guidance
      at <a href="https://ico.org.uk" style="color:#014D4E">ico.org.uk</a>. It explains each right and what
      organisations need to do to comply.</p>
      <p>If you have any questions, the <strong>Support</strong> tab is the best place to reach us.</p>
    `],
    ["Week 12 — Thank you, and what's next", `
      <p>Dear ${FIRST_NAME},</p>
      <p>Twelve weeks in — you're building something strong ⭐</p>
      <p>It's been 12 weeks since you began your AlwaysReady journey, and we hope the platform is becoming a
      natural part of how you manage compliance day-to-day. The services that perform best in CQC inspections
      are the ones that build small, steady habits. And you're doing exactly that.</p>
      <p><strong>Keep strengthening your lowest-rated KLOEs</strong><br>
      Continue focusing on the areas that need the most attention. Each improvement you make — even a small one
      — builds a clearer picture of safe, effective, responsive and well-led care.</p>
      <p><strong>Keep HR records current</strong><br>
      Up-to-date DBS checks, training certificates, and supervision dates are simple wins that make a big
      difference. They show strong governance and a well-supported team.</p>
      <p><strong>Use your Trend Report to track progress</strong><br>
      Check your Trend Report monthly to identify how far you've come and where to focus next. It turns your
      progress into something visible and motivating.</p>
      <p>Thank you for being an AlwaysReady customer. We're genuinely glad you're here, and we're excited to
      see how your journey continues.</p>
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
    await new Promise(resolve => setTimeout(resolve, 1000))
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

async function sendWaitlist(send: Awaited<ReturnType<typeof makeSender>>) {
  const emails: [string, string][] = [
    // ── Email 1: Welcome ─────────────────────────────────────────────────────
    ['[Waitlist 1] Welcome to the AlwaysReady waitlist', `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${FIRST_NAME},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Thank you for joining the AlwaysReady waitlist.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        AlwaysReady is a governance platform for CQC-regulated adult social care providers. It gives
        Registered Managers a single place to track compliance, manage evidence, and keep their workforce
        records current — as a year-round practice, not a periodic task.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        We're building AlwaysReady around the new CQC Adult Social Care Assessment Framework, due to be
        published in late autumn. We'll open to customers as soon as that happens — and as a waitlist
        member, you'll hear first.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        While you wait, we'll send you a short series of emails with useful information about CQC
        compliance, a look at the platform's features, and practical guidance for Registered Managers —
        whether or not you go on to use AlwaysReady.
      </p>
      <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
        If you have any questions in the meantime, visit
        <a href="https://alwaysready.uk/contact" style="color:#014D4E">alwaysready.uk/contact</a>.
      </p>
    `],

    // ── Email 2: Why we built this ───────────────────────────────────────────
    ['[Waitlist 2] Why we built AlwaysReady', `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${FIRST_NAME},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Registered Managers lead complex services, manage large teams, and hold direct responsibility for
        the safety and wellbeing of vulnerable people — often under real pressure and with limited resources.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        The hardest part of that job is rarely the care itself. It's the evidence. Good practice, recorded
        consistently over time, is hard to manage when records live across spreadsheets, paper files, and
        shared drives — each system updated by a different person, at different times, in different formats.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        AlwaysReady was built to give that work a proper home. A single place where compliance records
        are updated as the work happens, where evidence is attached to the standard it evidences, and
        where a complete, timestamped history builds itself in the background.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        The result is a service whose compliance record reflects what it actually does — accurate,
        current, and held to a standard a CQC inspector can see for themselves.
      </p>
      <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
        Over the next few weeks we'll show you exactly how it works.
      </p>
    `],

    // ── Email 3: Feature spotlight — KLOE tracker ────────────────────────────
    ['[Waitlist 3] How AlwaysReady tracks your KLOEs', `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${FIRST_NAME},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        At the heart of AlwaysReady is your KLOE tracker — a structured view of every Key Line of Enquiry
        that applies to your service, organised by CQC's five key questions: Safe, Effective, Caring,
        Responsive, and Well-led.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        For each KLOE, you can:
      </p>
      <ul style="margin:0 0 24px;padding-left:24px;font-size:15px;line-height:1.9;color:#1a1a1a">
        <li><strong>Set a compliance status</strong> — Not Started, In Progress, or Completed</li>
        <li><strong>Record a review date</strong> and set a review frequency — monthly, quarterly, annually, or custom</li>
        <li><strong>Upload evidence</strong> — policies, audits, training records, meeting minutes, and more</li>
        <li><strong>Add notes</strong> — context that sits alongside the record for anyone who needs it</li>
        <li><strong>Assign the KLOE to a team member</strong> — with email notifications sent automatically</li>
      </ul>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Every change is timestamped and recorded in a permanent audit trail. The full history of each
        KLOE — who updated it, when, and what changed — is available at any time.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        The platform calculates your overall readiness percentage and shows a breakdown by key question,
        so you can see at a glance where your service stands and which areas need attention.
      </p>
      <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
        Next time, we'll look at what CQC's five key questions actually mean — and what Good looks like
        under each one.
      </p>
    `],

    // ── Email 4: Educational — 5 things CQC always check ────────────────────
    ['[Waitlist 4] CQC\'s five key questions — what they mean in practice', `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${FIRST_NAME},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        CQC's inspection framework is built around five key questions. They apply to every service,
        and they shape every line of enquiry an inspector pursues. Understanding what each one means
        in practice shapes how you record and evidence your work throughout the year.
      </p>
      <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#014D4E">Safe</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        People are protected from abuse, risks are assessed and managed, and safeguarding systems are
        robust and kept current. Safe staffing — the right people in the right numbers — is a consistent
        focus.
      </p>
      <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#014D4E">Effective</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        People receive care based on good practice and evidence. This covers consent, nutrition,
        hydration, and whether staff have the training and skills to do their jobs well.
      </p>
      <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#014D4E">Caring</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        People are treated with dignity and respect, their privacy is upheld, and they are involved in
        decisions about their care. This is often assessed through conversations with residents and
        their families.
      </p>
      <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#014D4E">Responsive</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Care is personalised, complaints are handled well, and the service adapts to people's changing
        needs. CQC looks for evidence that care is built around individuals, not around what suits
        the organisation.
      </p>
      <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#014D4E">Well-led</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        The culture of the service, quality assurance processes, learning from incidents, and how well
        leadership understands the service's strengths and risks. A documented governance trail is often
        the difference between Good and Outstanding.
      </p>
      <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
        AlwaysReady maps every feature to these five areas, so the work you do in the platform connects
        directly to what CQC assesses.
      </p>
    `],

    // ── Email 5: Feature spotlight — HR module ───────────────────────────────
    ['[Waitlist 5] Workforce records that hold up to scrutiny', `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${FIRST_NAME},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Workforce records are among the first things a CQC inspector reviews. DBS checks, mandatory
        training, supervision frequency, appraisal history — they are central to Safe and Well-led.
        When those records are spread across spreadsheets, paper files, and shared drives, gaps appear.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        AlwaysReady's HR module keeps all of it in one place. For each staff member, you can record:
      </p>
      <ul style="margin:0 0 24px;padding-left:24px;font-size:15px;line-height:1.9;color:#1a1a1a">
        <li><strong>DBS checks</strong> — type, date, renewal date, and certificate upload</li>
        <li><strong>Training certificates</strong> — course name, completion date, expiry, and document upload</li>
        <li><strong>Supervision sessions</strong> — date, notes, and frequency tracking</li>
        <li><strong>Appraisals</strong> — date, outcome, and notes</li>
        <li><strong>Holiday allowance</strong> — annual entitlement tracked in days and hours</li>
        <li><strong>Absence episodes</strong> — with Bradford Factor calculation and return-to-work interview tracking</li>
      </ul>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        The platform sends automatic email reminders when a DBS check or training certificate is
        approaching its renewal date.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        It also calculates the Bradford Factor for each staff member automatically — a standard HR measure
        of absence patterns that CQC asks about under Well-led. The full absence history sits behind
        the calculation, available if it's ever needed.
      </p>
      <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
        All HR records are accessible to Admin users only, covered by the same data controls that
        protect all information in the platform.
      </p>
    `],

    // ── Email 6: Educational — Good vs Outstanding ───────────────────────────
    ['[Waitlist 6] What separates Good from Outstanding', `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${FIRST_NAME},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Services rated Good are, by definition, doing good things. The gap between Good and Outstanding
        usually comes down to the quality of the evidence, and the story it tells over time.
      </p>
      <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#014D4E">Outstanding services can show their practice, not just describe it</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        The evidence trail is dated, specific, and directly linked to outcomes for people. Inspectors
        can follow it rather than take the manager's word for it.
      </p>
      <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#014D4E">Outstanding services record their learning</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Inspectors look for evidence of learning from incidents, complaints, audits, and feedback.
        Outstanding services record what they learned, what they changed, and what the outcome was —
        not just that the incident occurred.
      </p>
      <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#014D4E">Outstanding governance is active year-round</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        An Outstanding Well-led rating comes from services where governance is embedded in day-to-day
        practice — regular audits, a proactive response to risk, and leadership that understands the
        service's strengths and weaknesses in detail.
      </p>
      <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#014D4E">90% of inspections are unannounced</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Outstanding services carry a current, evidenced compliance record as a matter of course —
        because there is no preparation window. AlwaysReady is built on that principle.
      </p>
      <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
        We've written more on this at
        <a href="https://alwaysready.uk/blog" style="color:#014D4E">alwaysready.uk/blog</a>.
      </p>
    `],

    // ── Email 7: Feature spotlight — Evidence management ────────────────────
    ['[Waitlist 7] Building an evidence trail that holds up', `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${FIRST_NAME},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Inspectors regularly find services where the evidence record doesn't reflect the quality of
        care being delivered. The practice is good. The record isn't there.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        AlwaysReady is built around capturing evidence as the work happens. Here's how it works in practice:
      </p>
      <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#014D4E">Upload directly to each KLOE</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Documents are uploaded into the KLOE they relate to. When a question comes up about
        safeguarding systems, you open the KLOE, and the evidence is right there — dated, named,
        and attached to the correct standard.
      </p>
      <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#014D4E">The audit trail builds itself</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Every status update, evidence upload, review completion, and priority change is permanently
        recorded with the date, time, and name of the person who made it — automatically, with
        no extra steps.
      </p>
      <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#014D4E">Your Evidence Pack is one click away</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        At any point, you can generate a printable PDF showing your full compliance position — RAG
        status, review dates, priorities, and evidence notes for every KLOE. It can be handed to an
        inspector or presented at a board meeting.
      </p>
      <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
        When evidence is captured as you work, inspectors can see the record directly — the same
        record that exists on every other day of the year.
      </p>
    `],

    // ── Email 8: Early access invitation ────────────────────────────────────
    ['[Waitlist 8] Beta Partner places — if you\'d like to get started now', `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${FIRST_NAME},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        We're approaching the CQC framework publication date, and we're opening AlwaysReady to
        customers shortly after.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        As a waitlist member, you'll have priority access at launch. We also have a small number of
        Beta Partner places available now, for services that want to start building their compliance
        record before the public opening.
      </p>
      <p style="margin:0 0 20px;padding:20px 24px;background:#f0fdfb;border-left:4px solid #00b8a6;border-radius:4px">
        <strong style="color:#014D4E;font-size:15px">Beta Partner — what's included</strong><br><br>
        <span style="font-size:15px;line-height:1.8;color:#1a1a1a">
          Full platform access · Priority support · Input into new features before they're built ·
          A reduced subscription rate locked in for 12 months from the launch date
        </span>
      </p>
      <p style="margin:0 0 32px">
        <a href="https://portal.alwaysready.uk/upgrade/beta"
           style="display:inline-block;background-color:#014D4E;color:#ffffff;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:600;text-decoration:none">
          Find out about Beta Partner access &rarr;
        </a>
      </p>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#555">
        Questions? Reply to this email or visit
        <a href="https://alwaysready.uk/contact" style="color:#014D4E">alwaysready.uk/contact</a>.
      </p>
    `],

    // ── Email 9: New CQC framework explainer ────────────────────────────────
    ['[Waitlist 9] The new CQC framework — what it means for your service', `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${FIRST_NAME},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        CQC has now published the new Adult Social Care Assessment Framework. Understanding it now,
        before inspectors begin applying it, shapes how you build your evidence record from the start.
      </p>
      <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#014D4E">The five key questions remain</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Safe, Effective, Caring, Responsive, and Well-led are unchanged. The structure you are
        familiar with continues.
      </p>
      <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#014D4E">Evidence expectations are higher</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        The new framework places greater emphasis on continuous, documented governance activity.
        Services with a consistent evidence record built over time are better placed to demonstrate
        compliance under it.
      </p>
      <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#014D4E">AlwaysReady is built for this framework</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Every KLOE in AlwaysReady maps directly to the new framework. From the moment you log in,
        your compliance tracker reflects the structure CQC uses to assess your service.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        We're publishing a detailed breakdown of the new framework on our blog shortly, with practical
        guidance on what it means for each key question. We'll send you the link when it's live.
      </p>
      <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
        AlwaysReady is launching very soon.
      </p>
    `],

    // ── Email 10: Launch announcement ────────────────────────────────────────
    ['[Waitlist 10] AlwaysReady is open — your access is ready', `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${FIRST_NAME},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        AlwaysReady is now open. As a waitlist member, you have priority access.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Your 14-day free trial gives you full access to every feature — the KLOE tracker, HR module,
        evidence management, audit trail, mock inspection, and Evidence Pack. No payment is required
        until your trial ends.
      </p>
      <div style="margin:0 0 24px;padding:20px 24px;background:#f5f4f1;border-left:4px solid #014D4E;border-radius:4px">
        <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#014D4E">What's included</p>
        <ul style="margin:0;padding-left:20px;font-size:15px;line-height:1.9;color:#1a1a1a">
          <li>KLOE tracker — pre-loaded with the new CQC framework</li>
          <li>Evidence uploads and document management</li>
          <li>HR module — staff records, DBS, training, supervision, absence</li>
          <li>Team access — invite colleagues and assign KLOEs</li>
          <li>Readiness dashboard and trend report</li>
          <li>Mock inspection and Evidence Pack</li>
          <li>Full audit trail on every change</li>
        </ul>
      </div>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        After your trial, a full subscription is <strong>£75/month</strong>. Cancel anytime.
        Charity discount applies automatically if you registered as a charity.
      </p>
      <p style="margin:0 0 32px">
        <a href="https://portal.alwaysready.uk/trial"
           style="display:inline-block;background-color:#014D4E;color:#ffffff;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:600;text-decoration:none">
          Start your free 14-day trial &rarr;
        </a>
      </p>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#555">
        Any questions before you start — we're at
        <a href="https://alwaysready.uk/contact" style="color:#014D4E">alwaysready.uk/contact</a>.
      </p>
    `],
  ]

  const results = []
  for (const [subject, bodyHtml] of emails) {
    results.push(await send(subject, bodyHtml, 'marketing'))
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  return results
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
    case 'account':    results = await sendAccount(send);    break
    case 'waitlist':   results = await sendWaitlist(send);  break
    case 'all': {
      const grouped = await Promise.all([
        sendWebsite(send),
        sendTrial(send),
        sendOnboarding(send),
        sendSupport(send),
        sendKloe(send),
        sendHr(send),
        sendAccount(send),
        sendWaitlist(send),
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
