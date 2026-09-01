'use server'

import { assertSuperadmin } from '@/lib/assert-superadmin'
import { sendEmail } from '@/lib/email'
import { getWaitlistNurtureEmail } from '@/lib/waitlist-nurture'
import { TRIAL_EMAILS, USER_EMAILS } from '@/lib/trial-emails'
import { ONBOARDING_EMAILS, buildHtml } from '@/lib/onboarding-emails'
import { PLATFORM_URL } from '@/lib/config'
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
  | 'waitlist-launch'
  | 'data-deletion'
  | 'subject-access-request'
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
      <p>Thank you for joining the AlwaysReady waitlist.</p>
      <p>We're building AlwaysReady around the new CQC Adult Social Care Assessment Framework,
         and we'll open to new customers as soon as the framework is published.
         When that happens, you'll be the first to know.</p>
      <p>If you have any questions in the meantime, you can reach us at
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
  const results: TestEmailResult[] = []

  // Day 0 — password setup email (sent by Stripe webhook; not in TRIAL_EMAILS)
  results.push(await send(
    "[Day 0] Your AlwaysReady trial is ready — set your password to get started",
    `
      <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">Hi ${FIRST_NAME},</p>
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
      <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Your trial runs until <strong>${EXPIRY_DATE}</strong>.
        If you have any questions, use the <strong>Support</strong> tab inside
        the platform and we will get back to you shortly.
      </p>
    `,
  ))

  // Trial sequence (days 1–13) and user team emails — from lib/trial-emails.ts
  for (const email of TRIAL_EMAILS) {
    results.push(await send(
      email.subject,
      email.bodyHtml(FIRST_NAME, EXPIRY_DATE, '£75'),
      email.isMarketing ? 'marketing' : 'transactional',
    ))
  }
  for (const email of USER_EMAILS) {
    results.push(await send(email.subject, email.bodyHtml(FIRST_NAME, ORG_NAME)))
  }

  return results
}

async function sendOnboarding(send: Awaited<ReturnType<typeof makeSender>>) {
  const results: TestEmailResult[] = []

  // Onboarding sequence (18 emails) — from lib/onboarding-emails.ts
  for (const email of ONBOARDING_EMAILS) {
    results.push(await send(email.subject, buildHtml(email.body(FIRST_NAME)), 'marketing'))
    // Avoid Resend rate limits when sending many emails in quick succession during testing
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
      <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">Hi ${FIRST_NAME},</p>
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
        Your support request has been resolved.
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
      <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
        If you have any questions, reply to this email or contact us at
        <a href="mailto:support@alwaysready.uk" style="color:#014D4E">support@alwaysready.uk</a>.
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
      <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
        If you have any questions, reply to this email or contact us at
        <a href="mailto:support@alwaysready.uk" style="color:#014D4E">support@alwaysready.uk</a>.
      </p>
    `),
  ])
}

async function sendWaitlist(send: Awaited<ReturnType<typeof makeSender>>) {
  // Emails 1–8: content pulled from shared lib/waitlist-nurture module
  const results = []
  for (let i = 1; i <= 8; i++) {
    const email = getWaitlistNurtureEmail(i, FIRST_NAME)
    if (email) {
      results.push(await send(`[Waitlist ${i}] ${email.subject}`, email.bodyHtml, 'marketing'))
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  return results
}

// ── Emails 9 + 10: event-triggered (not part of the weekly sequence) ──────────
// Sent manually from the Leads page when CQC publishes a framework date (Email 9)
// and when AlwaysReady launches (Email 10).

async function sendWaitlistLaunch(send: Awaited<ReturnType<typeof makeSender>>) {
  // Emails 9 + 10: content pulled from shared lib/waitlist-nurture module
  // (same source as the actual bulk send in app/superadmin/leads/actions.ts)
  const results = []
  for (const i of [9, 10] as const) {
    const email = getWaitlistNurtureEmail(i, FIRST_NAME)
    if (email) {
      results.push(await send(`[Waitlist ${i}] ${email.subject}`, email.bodyHtml, 'marketing'))
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  return results
}

async function sendAccount(send: Awaited<ReturnType<typeof makeSender>>) {
  // Note: password reset and password-changed emails are managed as Supabase Auth
  // templates in the Supabase dashboard — they are not sent by platform code.
  return Promise.all([
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
      <p style="margin:0 0 16px;background:#fef9ec;border-left:4px solid #ffd700;padding:12px 16px;border-radius:4px;font-size:15px;color:#1a1a1a;line-height:1.7">
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

// ── Data deletion emails ──────────────────────────────────────────────────────

async function sendDataDeletion(
  send: Awaited<ReturnType<typeof makeSender>>,
): Promise<TestEmailResult[]> {
  const deletionDate = '23 September 2026'
  return Promise.all([

    // 1. Request received — identity verification (user-initiated)
    send(
      'We have received your data deletion request — AlwaysReady',
      `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Hi ${FIRST_NAME},</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
          Thank you for your data deletion request, received on
          <strong>${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
          We will process it in accordance with the UK GDPR and our
          <a href="${PLATFORM_URL}/legal#privacy" style="color:#014D4E">Privacy Policy</a>.
        </p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
          To verify your identity and confirm the request, please reply to this email with the following:
        </p>
        <div style="background:#f8f9fa;border-left:4px solid #014D4E;padding:16px 20px;border-radius:0 6px 6px 0;margin:0 0 24px">
          <p style="margin:0 0 10px;font-size:15px;line-height:1.7;color:#1a1a1a">
            1. My full name is <strong>___________________________________</strong> and I am the account holder for the AlwaysReady account registered to <strong>${ORG_NAME}</strong>.
          </p>
          <p style="margin:0 0 10px;font-size:15px;line-height:1.7;color:#1a1a1a">
            2. I am making this data subject request on my own behalf.
          </p>
          <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
            3. I confirm that I submitted this request.
          </p>
        </div>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
          Once we have received your confirmation, we will process your request within <strong>30 days</strong>
          as required under UK GDPR Article 17. You will receive a separate email when your data has been deleted.
        </p>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#1a1a1a">
          If you did not submit this request, please let us know immediately by replying to this email
          so we can protect your account.
        </p>
        <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
          If you have any questions, contact us at
          <a href="mailto:support@alwaysready.uk" style="color:#014D4E">support@alwaysready.uk</a>.
        </p>
      `,
    ),

    // 2. 3-day warning (automated — scheduled account deletion)
    send(
      'Reminder: your AlwaysReady data will be deleted in 3 days',
      `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Hi ${FIRST_NAME},</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
          This is a reminder that the data for <strong>${ORG_NAME}</strong> on AlwaysReady
          will be permanently deleted on <strong>${deletionDate}</strong> — in 3 days.
        </p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
          You can download your data now by logging in and using the download buttons on the Account page.
          You can also resubscribe at any time before that date to keep your account and all your data.
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
      `,
    ),

    // 3. Deletion confirmed
    send(
      'Your AlwaysReady data has been deleted',
      `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Hi ${FIRST_NAME},</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
          All data associated with <strong>${ORG_NAME}</strong> on AlwaysReady
          has now been permanently deleted in accordance with our data retention policy and your request.
        </p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
          This includes your account, team member profiles, compliance records, evidence files, HR data,
          and all other information held within your workspace. No copies are retained.
        </p>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#1a1a1a">
          If you would like to start a new account in the future, you are very welcome to do so
          at <a href="https://alwaysready.uk" style="color:#014D4E">alwaysready.uk</a>.
        </p>
        <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
          If you have any questions about this deletion, contact us at
          <a href="mailto:support@alwaysready.uk" style="color:#014D4E">support@alwaysready.uk</a>.
        </p>
      `,
    ),

  ])
}

async function sendSubjectAccessRequest(
  send: Awaited<ReturnType<typeof makeSender>>,
): Promise<TestEmailResult[]> {
  const receivedDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const deadlineDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  return Promise.all([

    // 1. Acknowledgement — identity verification required
    send(
      'We have received your subject access request — AlwaysReady',
      `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Hi ${FIRST_NAME},</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
          Thank you for your subject access request (SAR), received on <strong>${receivedDate}</strong>.
          Under UK GDPR Article 15, you have the right to receive a copy of the personal data we hold about you.
          We will respond no later than <strong>${deadlineDate}</strong>.
        </p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
          Before we can release your data, we are required to verify your identity. Please reply to this email confirming the following:
        </p>
        <div style="background:#f8f9fa;border-left:4px solid #014D4E;padding:16px 20px;border-radius:0 6px 6px 0;margin:0 0 24px">
          <p style="margin:0 0 10px;font-size:15px;line-height:1.7;color:#1a1a1a">
            1. My full name is <strong>___________________________________</strong> and I am the account holder for the AlwaysReady account registered to <strong>${ORG_NAME}</strong>.
          </p>
          <p style="margin:0 0 10px;font-size:15px;line-height:1.7;color:#1a1a1a">
            2. I am making this subject access request on my own behalf.
          </p>
          <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
            3. I confirm that I submitted this request.
          </p>
        </div>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
          Once we have verified your identity, we will provide your data within the 30-day window required by law.
        </p>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#1a1a1a">
          If you did not submit this request, please let us know immediately by replying to this email.
        </p>
        <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
          If you have any questions, contact us at
          <a href="mailto:support@alwaysready.uk" style="color:#014D4E">support@alwaysready.uk</a>.
        </p>
      `,
    ),

    // 2. SAR fulfilled — data pack provided
    send(
      'Your AlwaysReady data — subject access request fulfilled',
      `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Hi ${FIRST_NAME},</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
          We have verified your identity and are writing to fulfil your subject access request, received on <strong>${receivedDate}</strong>.
        </p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
          The personal data we hold about you is set out below. You can also download a full copy of your data by logging in to your account and using the <strong>Export my data</strong> button on the Account page.
        </p>
        <div style="background:#f8f9fa;border-left:4px solid #014D4E;padding:16px 20px;border-radius:0 6px 6px 0;margin:0 0 24px">
          <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#1a1a1a">Data we hold about you:</p>
          <p style="margin:0 0 6px;font-size:15px;line-height:1.7;color:#1a1a1a">• Account details: name, email address, organisation name, registered address</p>
          <p style="margin:0 0 6px;font-size:15px;line-height:1.7;color:#1a1a1a">• Subscription and billing information (payment data is held by Stripe, not AlwaysReady)</p>
          <p style="margin:0 0 6px;font-size:15px;line-height:1.7;color:#1a1a1a">• Compliance records and evidence you have entered into the platform</p>
          <p style="margin:0 0 6px;font-size:15px;line-height:1.7;color:#1a1a1a">• HR records associated with your account</p>
          <p style="margin:0 0 6px;font-size:15px;line-height:1.7;color:#1a1a1a">• Files you have uploaded</p>
          <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">• Email communication history with AlwaysReady support</p>
        </div>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
          <strong>Where your data came from:</strong> directly from you, via the platform and any email correspondence.<br>
          <strong>Why we process it:</strong> to provide the AlwaysReady service as described in our <a href="${PLATFORM_URL}/legal#privacy" style="color:#014D4E">Privacy Policy</a>.<br>
          <strong>Who can see it:</strong> AlwaysReady staff only. We do not sell your data or share it with third parties except as set out in our Privacy Policy.
        </p>
        <p style="margin:0 0 32px">
          <a href="${PLATFORM_URL}/dashboard/account"
             style="display:inline-block;background-color:#014D4E;color:#ffffff;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:600;text-decoration:none">
            Download your data &rarr;
          </a>
        </p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
          If you believe any of your data is inaccurate or incomplete, you have the right to request a correction under UK GDPR Article 16. If you wish to have your data deleted, you may submit a deletion request by replying to this email.
        </p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
          If you are not satisfied with our response, you have the right to complain to the Information Commissioner's Office (ICO) at
          <a href="https://ico.org.uk" style="color:#014D4E">ico.org.uk</a> or by calling 0303 123 1113.
        </p>
        <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
          If you have any questions, contact us at
          <a href="mailto:support@alwaysready.uk" style="color:#014D4E">support@alwaysready.uk</a>.
        </p>
      `,
    ),

    // 3. SAR declined — unable to verify identity
    send(
      'Your subject access request — AlwaysReady',
      `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Hi ${FIRST_NAME},</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
          We are writing regarding your subject access request received on <strong>${receivedDate}</strong>.
        </p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
          Unfortunately, we have been unable to fulfil your request at this time. We are required to verify the identity of anyone making a subject access request before releasing personal data. We did not receive a satisfactory response to our identity verification request.
        </p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
          If you still wish to receive a copy of your data, please reply to this email with confirmation of your identity as described in our earlier message. We will be happy to process your request once identity has been confirmed.
        </p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
          If you believe we have handled your request incorrectly, you have the right to complain to the Information Commissioner's Office (ICO) at
          <a href="https://ico.org.uk" style="color:#014D4E">ico.org.uk</a> or by calling 0303 123 1113.
        </p>
        <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
          If you have any questions, contact us at
          <a href="mailto:support@alwaysready.uk" style="color:#014D4E">support@alwaysready.uk</a>.
        </p>
      `,
    ),

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
    case 'waitlist':        results = await sendWaitlist(send);        break
    case 'waitlist-launch':  results = await sendWaitlistLaunch(send);  break
    case 'data-deletion':          results = await sendDataDeletion(send);          break
    case 'subject-access-request': results = await sendSubjectAccessRequest(send); break
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
        sendWaitlistLaunch(send),
        sendDataDeletion(send),
        sendSubjectAccessRequest(send),
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
