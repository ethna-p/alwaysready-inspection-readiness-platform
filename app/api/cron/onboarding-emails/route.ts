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
      <p>If you have any questions, the <strong>Support</strong> tab is the best place to reach us.</p>
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
      <p>If you have any questions, the <strong>Support</strong> tab is the best place to reach us.</p>
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
      <p>If you have any questions, the <strong>Support</strong> tab is the best place to reach us.</p>
    `,
  },
  {
    weekId:    'week_08',
    threshold: 49,
    subject:   'Track your progress with the Trend Report',
    body: (firstName) => `
      <p>Dear ${firstName},</p>
      <p>This week we would like to introduce you to the Trend Report.</p>
      <p>The Trend Report is a tool that demonstrates your compliance position over time. It shows how your
      KLOE ratings have changed since you started using AlwaysReady, giving you a clear picture of the progress
      you have made.</p>
      <p>This is useful in several ways. It helps you see which areas have improved and which still need
      attention. It gives you something concrete to share with your board, your local authority, or your CQC
      inspector. And it serves as a record of the sustained effort your team has put in.</p>
      <p>The Trend Report is most useful when you have been using the platform consistently for several weeks.
      If you have been keeping your ratings up to date, you should already be starting to see a picture emerge.</p>
      <p>You can access the Trend Report from the main navigation inside the platform.</p>
      <p>If you have any questions, the <strong>Support</strong> tab inside the platform is the best place to reach us.</p>
    `,
  },
  {
    weekId:    'week_09',
    threshold: 56,
    subject:   'The AlwaysReady HR module',
    body: (firstName) => `
      <p>Dear ${firstName},</p>
      <p>This week we would like to focus on the HR module, an area that CQC inspectors pay close attention to,
      particularly in relation to the Well-led and Safe key questions.</p>
      <p>The HR module in AlwaysReady is designed to help you keep your staff records in order. It covers the
      information that inspectors are most likely to ask about: DBS checks, right to work documentation,
      training records, supervision and appraisal history, and employment status.</p>
      <p>Keeping these records current is not just about compliance. It is about being able to demonstrate,
      quickly and confidently, that your team is properly recruited, trained, and supported.</p>
      <p>Here are a few things we would encourage you to do this week.</p>
      <p><strong>Check that all staff records are complete.</strong> Look for any gaps in DBS checks, training
      certificates, or supervision dates.</p>
      <p><strong>Set a reminder for upcoming renewals.</strong> DBS checks and certain training certificates
      have expiry dates. Keeping on top of these is one of the most practical things you can do to stay
      inspection-ready.</p>
      <p><strong>Add staff who are not yet on the system.</strong> The more complete your records, the stronger
      your position when an inspector asks to see them.</p>
      <p>You can access the HR module from the main navigation inside the platform.</p>
      <p>If you have any questions, the <strong>Support</strong> tab inside the platform is the best place to reach us.</p>
    `,
  },
  {
    weekId:    'week_10',
    threshold: 63,
    subject:   'How AlwaysReady keeps your data safe',
    body: (firstName) => `
      <p>Dear ${firstName},</p>
      <p>This week we would like to tell you about how we protect the data you store in AlwaysReady.</p>
      <p>We understand that the information you enter into the platform is sensitive. Staff HR records,
      supervision notes, and compliance documentation are not things that should be left unsecured.
      Here is what we do to keep your data safe.</p>
      <ul style="margin:0 0 16px;padding-left:20px;line-height:1.8">
        <li>All data is encrypted at rest and in transit.</li>
        <li>Every file you upload is automatically scanned for viruses and malware before it is stored.</li>
        <li>Your data is held within the European Union and is not transferred outside of it.</li>
        <li>Each organisation's data is completely isolated from all other organisations on the platform.</li>
      </ul>
      <p>We take data protection seriously and are committed to full compliance with the UK General Data
      Protection Regulation. AlwaysReady acts as a data processor on your behalf. You remain the data controller
      and retain full ownership of your data at all times.</p>
      <p>You can read our full Data Security Statement and Data Retention Policy in the Help section inside
      the platform.</p>
      <p>If you have any questions about data security, the <strong>Support</strong> tab inside the platform
      is the best place to reach us.</p>
    `,
  },
  {
    weekId:    'week_11',
    threshold: 70,
    subject:   'Your data, your rights',
    body: (firstName) => `
      <p>Dear ${firstName},</p>
      <p>Last week we explained how we keep your data safe. This week we want to talk about your rights in
      relation to that data.</p>
      <p>Under the UK General Data Protection Regulation, individuals whose personal data is held within
      AlwaysReady have certain rights. They have the right to access the data held about them. They have the
      right to request that inaccurate data be corrected. They have the right to request that their data be
      deleted in certain circumstances. And they have the right to object to certain types of processing.</p>
      <p>As the data controller, your organisation is responsible for handling these requests from your staff.
      If a member of staff asks to see the information you hold about them in AlwaysReady, you are responsible
      for providing it.</p>
      <p>If you receive a data subject access request and are unsure how to respond, we would encourage you to
      seek appropriate legal advice. You can also find general guidance on the Information Commissioner's Office
      website at <a href="https://ico.org.uk" style="color:#014D4E">ico.org.uk</a>.</p>
      <p>We are here to help you fulfil your obligations as a data controller. If you have any questions about
      how we process data on your behalf, the <strong>Support</strong> tab inside the platform is the best
      place to reach us.</p>
    `,
  },
  {
    weekId:    'week_12',
    threshold: 77,
    subject:   'Twelve weeks in — thank you, and what\'s next',
    body: (firstName) => `
      <p>Dear ${firstName},</p>
      <p>Twelve weeks ago you started your AlwaysReady journey. We hope the platform has become a useful part
      of how you manage your compliance, and that you feel more confident and prepared than you did at the start.</p>
      <p>Over the past three months, we have walked you through the key features of the platform. You have had
      the chance to build your evidence base, manage your team records, review your KLOE ratings, track your
      progress over time, and keep a clear audit trail of everything you have done.</p>
      <p>Inspection readiness is not a one-off exercise. It is an ongoing commitment. The care providers who
      fare best in CQC inspections are those who make compliance part of their everyday routine rather than
      something they rush to prepare for when an inspection is announced.</p>
      <p>You are already doing that. Keep going.</p>
      <p>Here is what we would encourage you to focus on in the weeks ahead.</p>
      <ul style="margin:0 0 16px;padding-left:20px;line-height:1.8">
        <li>Continue reviewing your lowest-rated KLOEs and building evidence against them.</li>
        <li>Keep your HR records current, particularly DBS renewals, training certificates, and supervision records.</li>
        <li>Use the Trend Report each month to measure your progress and identify where attention is needed.</li>
      </ul>
      <p>If there is anything you need from us, the <strong>Support</strong> tab inside the platform is always there.</p>
      <p>Thank you for being an AlwaysReady customer. We are glad you are here.</p>
      <p style="margin-top:24px">P.S. We publish regular articles on CQC compliance, inspection preparation,
      and care sector best practice on our blog at
      <a href="https://alwaysready.uk/blog" style="color:#014D4E">alwaysready.uk/blog</a>.</p>
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
