/**
 * GET /api/cron/onboarding-emails
 *
 * Nightly cron (09:00 UTC) that sends the post-subscription weekly
 * onboarding email sequence to active subscribers.
 *
 * Logic:
 *   - Finds all active, non-demo orgs where subscribed_at is set
 *   - Calculates days elapsed since subscribed_at
 *   - Sends the matching week email when the threshold is first reached
 *   - Deduplication via notification_log (prevents re-sends on retries)
 *
 * Week thresholds:
 *   week_01 → days_elapsed >= 1   (day after subscribing — welcome email)
 *   week_02 → days_elapsed >= 7
 *   week_03 → days_elapsed >= 14
 *   week_04 → days_elapsed >= 21
 *   week_05 → days_elapsed >= 28
 *   week_06 → days_elapsed >= 35
 *   week_07 → days_elapsed >= 42
 *   week_08 → days_elapsed >= 49
 *   week_09 → days_elapsed >= 56
 *   week_10 → days_elapsed >= 63
 *   week_11 → days_elapsed >= 70
 *   week_12 → days_elapsed >= 77
 *
 * Security: requests must include Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'

const PLATFORM_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://portal.alwaysready.uk').replace(/\/$/, '')

// ── Email definitions ──────────────────────────────────────────────────────────

interface OnboardingEmail {
  weekId:    string  // e.g. 'week_01'
  threshold: number  // send when days_elapsed >= threshold
  subject:   string
  body:      (firstName: string) => string
}

const ONBOARDING_EMAILS: OnboardingEmail[] = [
  {
    weekId:    'week_01',
    threshold: 1,
    subject:   'Welcome to AlwaysReady — we\'re delighted to have you on board ⭐',
    body: (firstName) => `
      <p>Dear ${firstName},</p>
      <p>Welcome to AlwaysReady — we're delighted to have you on board ⭐</p>
      <p>This week, we encourage you to begin building your evidence base straight away. A great first step
      is to identify the KLOEs you feel least confident with. Choose one KLOE to focus on and outline your
      next steps. You can add notes, upload documents, and start recording your actions as you go.</p>
      <p>This early activity is incredibly valuable — it shows CQC that you've recognised an area for
      improvement and taken clear, proactive steps to address it.</p>
      <p>We also publish regular articles on CQC compliance, inspection preparation, and care sector best practice
      on our blog at <a href="https://alwaysready.uk/blog" style="color:#014D4E">alwaysready.uk/blog</a>.
      We hope you find it a useful resource alongside the platform.</p>
      <p>If you have any questions, the <strong>Support</strong> tab inside the platform is the best place to reach us.</p>
    `,
  },
  {
    weekId:    'week_02',
    threshold: 7,
    subject:   'Setting up your team on AlwaysReady ⭐',
    body: (firstName) => `
      <p>Dear ${firstName},</p>
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
    `,
  },
  {
    weekId:    'week_03',
    threshold: 14,
    subject:   'Getting the most from your KLOEs ⭐',
    body: (firstName) => `
      <p>Dear ${firstName},</p>
      <p>This week: getting the most from your KLOE section ⭐</p>
      <p><strong>Start with your weakest KLOEs</strong><br>
      Begin with the KLOEs you feel least confident about. It can be tempting to focus on areas where you are
      already strong, but inspectors will pay close attention to areas where improvement is needed. Identify your
      lowest-rated KLOEs and begin building evidence against them.</p>
      <p><strong>Review the rating descriptions</strong><br>
      Each KLOE includes CQC's rating characteristics, which describe what Outstanding, Good, Requires Improvement,
      and Inadequate look like in practice. Reading these carefully will help you understand exactly what
      inspectors are looking for.</p>
      <p><strong>Add specific, dated evidence</strong><br>
      Record what happened, when it happened, and what the outcome was. Vague statements are far less convincing
      than concrete, dated examples. Be as specific as you can when adding notes or uploading documents.</p>
      <p><strong>Update little and often</strong><br>
      Small, regular updates keep you inspection-ready all year round. You do not need to set aside large blocks
      of time — even five minutes a day makes a real difference over weeks and months.</p>
      <p>Got a question? The <strong>Support</strong> tab is where to find us.</p>
    `,
  },
  {
    weekId:    'week_04',
    threshold: 21,
    subject:   'Building your evidence library ⭐',
    body: (firstName) => `
      <p>Dear ${firstName},</p>
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
    `,
  },
  {
    weekId:    'week_05',
    threshold: 28,
    subject:   'Have you tried the Daily Report? ⭐',
    body: (firstName) => `
      <p>Dear ${firstName},</p>
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
    `,
  },
  {
    weekId:    'week_06',
    threshold: 35,
    subject:   'Your audit trail ⭐',
    body: (firstName) => `
      <p>Dear ${firstName},</p>
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
    `,
  },
  {
    weekId:    'week_07',
    threshold: 42,
    subject:   'Sharing access with external visitors ⭐',
    body: (firstName) => `
      <p>Dear ${firstName},</p>
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
    `,
  },
  {
    weekId:    'week_08',
    threshold: 49,
    subject:   'Track your progress with the Trend Report ⭐',
    body: (firstName) => `
      <p>Dear ${firstName},</p>
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
    `,
  },
  {
    weekId:    'week_09',
    threshold: 56,
    subject:   'The HR module ⭐',
    body: (firstName) => `
      <p>Dear ${firstName},</p>
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
    `,
  },
  {
    weekId:    'week_10',
    threshold: 63,
    subject:   'How AlwaysReady keeps your data safe ⭐',
    body: (firstName) => `
      <p>Dear ${firstName},</p>
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
    `,
  },
  {
    weekId:    'week_11',
    threshold: 70,
    subject:   'Your data, your rights ⭐',
    body: (firstName) => `
      <p>Dear ${firstName},</p>
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
    `,
  },
  {
    weekId:    'week_12',
    threshold: 77,
    subject:   'Twelve weeks in — you\'re building something strong ⭐',
    body: (firstName) => `
      <p>Dear ${firstName},</p>
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
    `,
  },
]

// ── Email body fragment ────────────────────────────────────────────────────────
// Returns the inner body only — no header, no footer, no unsubscribe link.
// sendEmail() in lib/email.ts wraps this in the full branded template and
// appends the unsubscribe footer automatically for type: 'marketing'.

function buildHtml(bodyInner: string): string {
  return `
    ${bodyInner}
    <p style="margin:32px 0 0">
      <a href="${PLATFORM_URL}/dashboard"
         style="display:inline-block;background-color:#014D4E;color:#ffffff;padding:14px 28px;border-radius:6px;font-size:15px;font-weight:600;text-decoration:none">
        Go to your dashboard &rarr;
      </a>
    </p>
  `
}

// ── Route handler ──────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Fetch all active, non-demo orgs with a subscription date set
  const { data: orgs, error: orgsError } = await supabase
    .from('organisations')
    .select('id, subscribed_at')
    .eq('subscription_tier', 'active')
    .not('subscribed_at', 'is', null)

  if (orgsError) {
    console.error('[onboarding-emails] orgs query error:', orgsError.message)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  const now = new Date()
  let totalSent = 0
  let totalSkipped = 0

  for (const org of orgs ?? []) {
    const subscribedAt   = new Date(org.subscribed_at as string)
    const msElapsed      = now.getTime() - subscribedAt.getTime()
    const daysElapsed    = Math.floor(msElapsed / (1000 * 60 * 60 * 24))
    const anchorDate     = subscribedAt.toISOString().slice(0, 10)

    // Iterate emails in threshold order; send every email whose threshold is first
    // met today. Deduplication via notification_log prevents re-sends on retries
    // or catch-up runs.

    // Fetch all existing onboarding log entries for this org
    const { data: existingLogs } = await supabase
      .from('notification_log')
      .select('entity_id')
      .eq('organisation_id', org.id)
      .eq('notification_type', 'onboarding_week')
      .eq('entity_type', 'onboarding')

    const sentWeekIds = new Set((existingLogs ?? []).map((r: { entity_id: string }) => r.entity_id))

    // Fetch admins for this org — exclude anyone who has opted out of marketing emails
    const { data: admins } = await supabase
      .from('users')
      .select('id, email, full_name, marketing_opt_out')
      .eq('organisation_id', org.id)
      .eq('role', 'admin')
      .eq('marketing_opt_out', false)

    if (!admins?.length) continue

    for (const email of ONBOARDING_EMAILS) {
      if (daysElapsed < email.threshold) break  // threshold not yet reached
      if (sentWeekIds.has(email.weekId))   continue  // already sent

      for (const admin of admins) {
        if (!admin.email) continue
        const firstName = admin.full_name?.split(' ')[0] ?? 'there'

        const result = await sendEmail({
          to:       admin.email,
          subject:  email.subject,
          type:     'marketing',
          userId:   admin.id,
          bodyHtml: buildHtml(email.body(firstName)),
        })

        if (result.sent) {
          // Log it — deduplication anchor is subscribed_at date
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from('notification_log')
            .insert({
              organisation_id:   org.id,
              notification_type: 'onboarding_week',
              entity_type:       'onboarding',
              entity_id:         email.weekId,
              due_date:          anchorDate,
              recipient_email:   admin.email,
            })
            .onConflict('organisation_id,notification_type,entity_type,entity_id,due_date,recipient_email')
            .ignore()

          totalSent++
        } else {
          console.warn(`[onboarding-emails] skipped ${email.weekId} → ${admin.email}: ${result.error ?? result.skipped}`)
          totalSkipped++
        }
      }
    }
  }

  console.log(`[onboarding-emails] sent=${totalSent} skipped=${totalSkipped}`)
  return NextResponse.json({ sent: totalSent, skipped: totalSkipped }, { status: 200 })
}
