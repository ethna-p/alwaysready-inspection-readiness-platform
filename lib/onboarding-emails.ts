/**
 * Shared post-subscription onboarding email definitions.
 * Used by:
 *   - app/api/cron/onboarding-emails/route.ts    (sends emails nightly)
 *   - app/superadmin/test-emails/actions.ts       (preview in test panel)
 */

import { PLATFORM_URL } from '@/lib/config'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OnboardingEmail {
  weekId:    string  // e.g. 'week_01'
  threshold: number  // send when days_elapsed >= threshold
  subject:   string
  body:      (firstName: string) => string
}

// ── Email body wrapper ────────────────────────────────────────────────────────
// Returns the inner body only — no header, no footer, no unsubscribe link.
// sendEmail() in lib/email.ts wraps this in the full branded template and
// appends the unsubscribe footer automatically for type: 'marketing'.

export function buildHtml(bodyInner: string): string {
  return `
    ${bodyInner}
    <p style="margin:32px 0 0">
      <a href="${PLATFORM_URL}/dashboard"
         style="display:inline-block;background-color:#014D4E;color:#ffffff;padding:14px 28px;border-radius:6px;font-size:16px;font-weight:600;text-decoration:none">
        Go to your dashboard &rarr;
      </a>
    </p>
  `
}

// ── Email definitions ─────────────────────────────────────────────────────────

export const ONBOARDING_EMAILS: OnboardingEmail[] = [
  {
    weekId:    'week_01',
    threshold: 1,
    subject:   'Welcome to AlwaysReady — we\'re delighted to have you on board ⭐',
    body: (firstName) => `
      <p>Hi ${firstName},</p>
      <p>Welcome to AlwaysReady — we're delighted to have you on board ⭐</p>
      <p>This week, we encourage you to begin building your evidence base straight away. A great first step
      is to identify the KLOEs you feel least confident with. Choose one KLOE to focus on and outline your
      next steps. You can add notes, upload documents, and start recording your actions as you go.</p>
      <p>This early activity matters — it shows CQC that you've recognised an area for improvement and
      taken clear steps to address it.</p>
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
      <p>Hi ${firstName},</p>
      <p>This week is about getting your team set up on the platform ⭐</p>
      <p>Go to the <strong>Team</strong> section in the main navigation to invite staff members. Once they're in,
      you can assign them specific KLOEs to manage, so evidence is added steadily throughout the year by the people
      closest to the work.</p>
      <p>Staff can also update their own profile in the <strong>My Profile</strong> section, including their
      emergency contact details. This keeps HR records current without creating additional admin for you.</p>
      <p>As your team takes ownership of their KLOEs, they build familiarity with compliance expectations and
      become more confident discussing the work they do. That confidence matters whenever an inspector arrives.</p>
      <p>If you have any questions, hit reply — we read everything.</p>
    `,
  },
  {
    weekId:    'week_03',
    threshold: 14,
    subject:   'Getting the most from your KLOEs ⭐',
    body: (firstName) => `
      <p>Hi ${firstName},</p>
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
      <p>We're here whenever you need us — just reply to this email or use the <strong>Support</strong> tab.</p>
    `,
  },
  {
    weekId:    'week_04',
    threshold: 21,
    subject:   'Building your evidence library ⭐',
    body: (firstName) => `
      <p>Hi ${firstName},</p>
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
      <p>What area of evidence feels hardest to keep up with? Reply and let us know — it helps us understand what
      to focus on and what to build next.</p>
    `,
  },
  {
    weekId:    'week_05',
    threshold: 28,
    subject:   'Have you tried the Daily Report? ⭐',
    body: (firstName) => `
      <p>Hi ${firstName},</p>
      <p>This week we are focusing on your Daily Report ⭐</p>
      <p><strong>Understand your current compliance position</strong><br>
      The Daily Report gives you a real-time snapshot of where your compliance stands today. It shows which KLOEs
      are up to date, which need reviewing, and which have never been assessed. This helps you see your strengths
      and your gaps at a glance. It also gives you a clear starting point for what to focus on next.</p>
      <p><strong>Use it to guide your daily actions</strong><br>
      We encourage you to make the Daily Report part of your everyday routine. Even a quick five-minute check each
      morning helps you stay aware of what needs attention. Over time, these small daily check-ins build strong
      habits. They also reduce the pressure of having to catch up when a gap is identified.</p>
      <p><strong>Spot issues early and act quickly</strong><br>
      By reviewing your Daily Report regularly, you can identify gaps before they become risks. You will see where
      evidence is missing, where updates are overdue, and where improvements are needed. Early action is one of the
      strongest indicators of good governance. It shows CQC that you monitor your service actively and respond promptly.</p>
      <p><strong>Build confidence across your team</strong><br>
      When the Daily Report becomes part of your routine, your whole team benefits. Everyone knows what is expected.
      Everyone can see progress. And everyone feels more prepared for conversations with inspectors. This creates a
      culture where compliance is continuous, not occasional.</p>
      <p>You will find more guidance in the <strong>Help</strong> tab, or just reply if you have a specific question.</p>
    `,
  },
  {
    weekId:    'week_06',
    threshold: 35,
    subject:   'Your audit trail ⭐',
    body: (firstName) => `
      <p>Hi ${firstName},</p>
      <p>This week we are focusing on your audit trail ⭐</p>
      <p><strong>Every change is recorded</strong><br>
      Every update you make in AlwaysReady is automatically logged. The system records who made the change,
      what was updated, and when it happened. This creates a clear, reliable audit trail. It shows how your
      service thinks, responds, and improves over time. It also helps you track progress, understand
      decision-making, and see how actions link to outcomes.</p>
      <p><strong>Your journey matters to CQC</strong><br>
      CQC inspectors are interested in more than your current position. They want to understand the journey
      you have been on. They look for evidence that you identify issues, take action, and follow through. A
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
      <p>As always, we are here if you need us. The <strong>Support</strong> tab is the quickest route.</p>
    `,
  },
  {
    weekId:    'week_07',
    threshold: 42,
    subject:   'Sharing access with external visitors ⭐',
    body: (firstName) => `
      <p>Hi ${firstName},</p>
      <p>This week we are focusing on visitor access ⭐</p>
      <p><strong>Create secure, time-limited visitor logins</strong><br>
      AlwaysReady lets you create a secure, time-limited visitor login for external reviewers. Visitors can
      view your KLOE ratings and evidence, but they cannot make any changes. This keeps your records accurate
      and protected.</p>
      <p><strong>Ideal for CQC inspectors</strong><br>
      Viewer logins are especially helpful during a CQC inspection. Inspectors can access the information they
      need quickly and see your evidence exactly as you have organised it. This makes inspections smoother and
      shows confidence in your governance.</p>
      <p><strong>Useful for audits and peer reviews</strong><br>
      You can also use visitor access for consultants, peer reviewers, and quality assurance partners. They can
      review your compliance position directly and offer focused feedback, while you stay fully in control of
      who sees what and for how long.</p>
      <p><strong>Easy to set up</strong><br>
      To create a visitor login, go to the <strong>Team</strong> section in the main navigation. Set the access
      period, send the login, and revoke it whenever you choose.</p>
      <p>The <strong>Support</strong> tab is there if you need a hand — or just reply to this email.</p>
    `,
  },
  {
    weekId:    'week_08',
    threshold: 49,
    subject:   'Track your progress with the Analytics Report ⭐',
    body: (firstName) => `
      <p>Hi ${firstName},</p>
      <p>This week we are focusing on your Analytics Report ⭐</p>
      <p><strong>See how your compliance has evolved</strong><br>
      The Analytics Report shows how your KLOE ratings have changed over time. It highlights improvements, dips,
      and areas where your work has remained consistent. This gives you a clear picture of your journey since
      you started using AlwaysReady. It helps you understand not just where you are today, but how you got there.</p>
      <p><strong>Turn progress into evidence</strong><br>
      Trend data is powerful because it shows movement. Inspectors and stakeholders want to see that you identify
      issues, take action, and follow through. The Analytics Report gives you concrete evidence of that process. It
      shows that your governance is active, ongoing, and responsive.</p>
      <p><strong>Share meaningful insights with stakeholders</strong><br>
      You can use the Analytics Report to update your board, your local authority, or a CQC inspector. It provides
      a simple, visual way to demonstrate improvement and highlight areas that still need attention. This makes
      conversations clearer, more focused, and more productive. It also shows that you monitor your service actively.</p>
      <p><strong>Strengthen your inspection narrative</strong><br>
      During an inspection, inspectors want to understand your story. The Analytics Report helps you explain what has
      changed, why it changed, and what you are doing next. It supports a confident, evidence-based narrative that
      reflects continuous improvement.</p>
      <p>Is the Analytics Report showing progress you are pleased with, or are there areas giving you concern? Hit reply. We would like to know how you are getting on.</p>
    `,
  },
  {
    weekId:    'week_09',
    threshold: 56,
    subject:   'The HR module ⭐',
    body: (firstName) => `
      <p>Hi ${firstName},</p>
      <p>This week we are focusing on your HR module ⭐</p>
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
      <p><strong>Compliance overview in the Analytics section</strong><br>
      The Analytics section also includes an overview of HR compliance across your team: how many staff have
      current DBS checks, up-to-date training, and completed supervision. It gives you a dashboard view of
      workforce compliance without having to check each record individually.</p>
      <p>If an HR record or training date is giving you trouble, just reply. We are happy to help.</p>
    `,
  },
  {
    weekId:    'week_10',
    threshold: 63,
    subject:   'What Outstanding services do differently ⭐',
    body: (firstName) => `
      <p>Hi ${firstName},</p>
      <p>This week, something a little different ⭐</p>
      <p>Most registered managers we speak to are aiming for Good. A smaller number are aiming for Outstanding.
      The gap between the two is real — but it is not as wide as it might seem.</p>
      <p><strong>Outstanding is not about perfection</strong><br>
      CQC does not expect Outstanding services to be without challenges. What they look for is how a service
      responds to challenges. Outstanding services identify problems early, act on them quickly, and record what
      they did and why. The record matters as much as the action.</p>
      <p><strong>The difference is often cultural, not procedural</strong><br>
      Research commissioned by CQC and carried out by The King's Fund found that Outstanding services share
      five characteristics: they are truly person-centred; they have compassionate and inclusive leadership;
      they prioritise equity and inclusion; they build continuous learning into daily practice; and they focus
      deliberately on making a positive difference to outcomes. None of these are policy changes. They are
      ways of working.</p>
      <p><strong>People who use services can feel the difference</strong><br>
      In the research, people who used Outstanding services described feeling genuinely known by staff — not
      as a set of needs, but as a whole person. They said they had real influence over decisions. That level
      of experience does not happen by accident. It is the result of leadership that takes person-centred care
      seriously at every level.</p>
      <p><strong>Evidence is what makes the difference visible</strong><br>
      Outstanding services are often doing things that Good services also do. The difference is that they can
      demonstrate it. Their evidence is specific, dated, and shows a clear journey from issue to action to
      outcome. If that describes the work you are already doing, the next step is making sure it is recorded
      with that level of detail.</p>
      <p>If you are thinking about what Outstanding would look like for your service, hit reply. It is a conversation we enjoy having.</p>
    `,
  },
  {
    weekId:    'week_11',
    threshold: 70,
    subject:   'How to run a mock inspection ⭐',
    body: (firstName) => `
      <p>Hi ${firstName},</p>
      <p>This week: how to run a mock inspection ⭐</p>
      <p>A mock inspection is one of the most effective things you can do to prepare for the real thing. It
      surfaces gaps you might not have noticed, builds staff confidence, and gives you a clear action list.
      Here is how to approach it.</p>
      <p><strong>Step 1: Book a date and treat it seriously</strong><br>
      Schedule a half-day and commit to it. Tell your team enough in advance that they can prepare, but make
      clear that the purpose is to find gaps, not to perform. A mock inspection is most useful when it reflects
      real, everyday practice.</p>
      <p><strong>Step 2: Walk through all five key questions</strong><br>
      Work through Safe, Effective, Caring, Responsive, and Well-led in turn. For each one, ask: what is our
      current rating? What evidence supports that? If an inspector arrived today, what would they see? Be honest.
      The purpose is to identify what needs attention, not to confirm what you already know is strong.</p>
      <p><strong>Step 3: Check your documentation against your practice</strong><br>
      This is where most services find their gaps. Policies say one thing; what staff actually do can be
      different. Pick three or four common scenarios: a medication incident, a safeguarding concern, a
      complaint. Trace what happens from start to finish. Does the paper trail match the process?</p>
      <p><strong>Step 4: Review your evidence in AlwaysReady</strong><br>
      Look at each KLOE and ask whether the evidence is current, specific, and dated. Vague notes and
      undated documents will not stand up under scrutiny. Anything more than 12 months old should be reviewed
      and updated or replaced with something more recent.</p>
      <p><strong>Step 5: Build your action list</strong><br>
      At the end of the mock inspection, write down everything that needs attention, ranked by risk. Assign
      an owner and a deadline to each item. Review progress at your next team meeting. The action list is
      itself evidence of good governance.</p>
      <p>AlwaysReady's Mock Inspection feature is designed for exactly this. You can complete a full mock
      inspection across all five key questions, or work through a single KLOE at a time if that suits your
      schedule better. If you have not used it yet, now is a good time to start.</p>
      <p>Any questions about running your first mock inspection? Just reply. We are glad to help.</p>
    `,
  },
  {
    weekId:    'week_12',
    threshold: 77,
    subject:   'Twelve weeks in ⭐',
    body: (firstName) => `
      <p>Hi ${firstName},</p>
      <p>Twelve weeks in: you are building something strong ⭐</p>
      <p>It has been 12 weeks since you began your AlwaysReady journey, and we hope the platform is becoming a
      natural part of how you manage compliance day to day. The services that perform best in CQC inspections
      are the ones that build small, steady habits. You are doing exactly that.</p>
      <p><strong>Keep strengthening your lowest-rated KLOEs</strong><br>
      Continue focusing on the areas that need the most attention. Each improvement you make, even a small one,
      builds a clearer picture of safe, effective, responsive, and well-led care.</p>
      <p><strong>Keep HR records current</strong><br>
      Up-to-date DBS checks, training certificates, and supervision dates are simple wins that make a big
      difference. They show strong governance and a well-supported team.</p>
      <p><strong>Use your Analytics Report to track progress</strong><br>
      Check your Analytics Report monthly to identify how far you have come and where to focus next. It turns
      your progress into something visible and motivating.</p>
      <p>Three months in feels like a good moment to ask: how has the journey been so far? What is working
      well, and is there anything you wish the platform did differently? We read every reply and your feedback
      shapes what we build next.</p>
      <p>Thank you for being an AlwaysReady customer. We are genuinely glad you are here.</p>
    `,
  },
  {
    weekId:    'week_16',
    threshold: 112,
    subject:   'Is your evidence keeping up with your practice? ⭐',
    body: (firstName) => `
      <p>Hi ${firstName},</p>
      <p>A quick check-in this month ⭐</p>
      <p>One of the most common issues we see in CQC inspections is a gap between what a service does and
      what it can prove. The care is good. The records do not show it. Inspectors can only act on what they
      see, so if the evidence is thin or out of date, the rating will not reflect the work being done.</p>
      <p>It is worth reviewing your evidence library this month with that question in mind: does what is
      recorded in AlwaysReady still reflect how your service actually works today?</p>
      <p><strong>Things worth checking:</strong></p>
      <p>Are your highest-priority KLOEs backed by evidence from the last six months? If not, what has
      changed in practice that should be documented?</p>
      <p>Are there KLOEs where you feel confident about the care but the evidence is sparse? Those gaps
      are worth closing sooner rather than later.</p>
      <p>Are any uploaded documents now out of date: old policies that have since been reviewed,
      training records that have since been refreshed, meeting minutes from two years ago?</p>
      <p>Your Daily Report will show you which KLOEs have not been updated recently. It is a good starting
      point for this kind of monthly review.</p>
      <p>If you are unsure where to start, just reply. We are happy to think it through with you.</p>
    `,
  },
  {
    weekId:    'week_20',
    threshold: 140,
    subject:   'Getting your team inspection-ready ⭐',
    body: (firstName) => `
      <p>Hi ${firstName},</p>
      <p>This month's check-in is about your team ⭐</p>
      <p>CQC inspectors do not only look at records. They talk to staff. They ask questions about how the
      service works, how decisions are made, and how people who use the service are supported. What staff
      say in those conversations matters, and it can make or break a rating.</p>
      <p>Services that consistently perform well in inspections usually have one thing in common: staff who
      feel genuinely involved in compliance, not just informed about it. They know what the KLOEs mean.
      They understand why evidence is recorded. They can explain their own role in keeping the service safe
      and effective.</p>
      <p>That kind of team readiness does not happen overnight. It is built through regular conversations,
      shared ownership of KLOEs, and a culture where governance is part of everyday practice rather than
      something that only gets attention when an inspector is in the building.</p>
      <p><strong>A few things worth thinking about:</strong></p>
      <p>Have your team members logged in and reviewed the KLOEs they are responsible for recently? Are
      there staff who have never used the platform, or who are unsure what they are supposed to do in it?
      Has your team discussed what an inspection looks like and how they should respond to an inspector's
      questions?</p>
      <p>If staff engagement is something you would like to improve, hit reply. It is one of the most
      impactful things a registered manager can do.</p>
    `,
  },
  {
    weekId:    'week_25',
    threshold: 175,
    subject:   'Six months in: something worth checking ⭐',
    body: (firstName) => `
      <p>Hi ${firstName},</p>
      <p>Six months in ⭐</p>
      <p>Something worth knowing at this stage: in CQC inspections, one of the most common findings is an
      uneven evidence base. A service can have strong records for Safe and Caring, and almost nothing for
      Well-Led. Inspectors notice that gap, and it affects ratings even when the underlying governance is
      sound. The records do not reflect the reality.</p>
      <p>It is worth opening your Analytics Report and looking at the spread across all five key questions.
      Not just the overall score, but which KLOEs have recent evidence and which have gone quiet. If some
      areas are thin, now is a good time to address them while there is no pressure to do so.</p>
      <p>Did you know the platform includes a Mock Inspection tool? It walks you through all five key
      questions so you can identify gaps before an inspector does. If you have not used it yet, it takes
      around 30 minutes and often surfaces things that are easy to fix once you know they are there.</p>
      <p>One question for us: what is the one thing you wish AlwaysReady did that it does not do yet?
      We read every reply, and it directly shapes what we build next.</p>
    `,
  },
  {
    weekId:    'week_30',
    threshold: 210,
    subject:   'Preparing for your next CQC visit ⭐',
    body: (firstName) => `
      <p>Hi ${firstName},</p>
      <p>Your monthly check-in ⭐</p>
      <p>CQC inspections are unannounced. The average gap between inspections in adult social care is around
      two to three years, but that gap can be shorter if something triggers a concern. The services that
      handle inspections most confidently are the ones that are never really preparing for the next one,
      because they are always ready for it.</p>
      <p>This month, it is worth thinking about your inspection narrative: the story you would tell an
      inspector if they walked through your door today.</p>
      <p><strong>A useful exercise:</strong> imagine an inspector asks you to summarise your service's
      progress over the past year. What improvements have you made? What challenges have you faced, and
      how have you responded? What are you most proud of, and what are you still working on?</p>
      <p>If you can answer those questions clearly and point to evidence in AlwaysReady that supports each
      one, you are in a strong position. If any of those answers feel uncertain, that is useful to know.
      It tells you where to focus your attention now.</p>
      <p>Your Analytics Report and your Mock Inspection findings are good places to start this kind of
      review. If you would like to talk through your inspection narrative, just reply.</p>
    `,
  },
  {
    weekId:    'week_38',
    threshold: 266,
    subject:   'Nine months in: a compliance review worth doing ⭐',
    body: (firstName) => `
      <p>Hi ${firstName},</p>
      <p>Nine months: your monthly check-in ⭐</p>
      <p>At around the nine-month mark, it is worth doing a more structured compliance review. Not a reactive
      review, but the kind that helps you genuinely understand where your service stands and what still needs
      attention.</p>
      <p><strong>KLOE ratings:</strong> Go through each KLOE and ask honestly whether your current rating
      still reflects practice. Have any areas improved and not yet been updated? Are any areas weaker than
      they were six months ago?</p>
      <p><strong>Evidence currency:</strong> How much of your uploaded evidence is from the past 12 months?
      Anything older than that should be reviewed and either replaced or supplemented with something more current.</p>
      <p><strong>HR records:</strong> Are all DBS checks, training certificates, and supervision records
      up to date? A gap here is one of the most common issues inspectors flag.</p>
      <p><strong>Action plans:</strong> If you have run a mock inspection and generated findings, how many
      of those action items have been completed? Incomplete action plans carry risk: they are evidence that
      issues were identified but not resolved.</p>
      <p>If you would like a hand working through any of these areas, reply and let us know where to start.</p>
    `,
  },
  {
    weekId:    'week_52',
    threshold: 365,
    subject:   'One year with AlwaysReady ⭐',
    body: (firstName) => `
      <p>Hi ${firstName},</p>
      <p>One year. That is worth acknowledging ⭐</p>
      <p>Twelve months ago, you signed up to AlwaysReady. A year of consistent work on compliance, building
      evidence, updating KLOEs, keeping HR records current, is exactly the kind of sustained effort CQC
      looks for. It does not happen by accident.</p>
      <p>At the one-year mark, your Analytics Report will show you something genuinely useful: how your KLOE
      ratings have moved since you started. Which areas have strengthened? Which have stayed still? A year of
      data gives you a real picture of direction, not just a snapshot.</p>
      <p>It is also a good moment to look at what the next 12 months need. Is there a KLOE that has had
      little attention? A part of the platform you have not yet used? The Mock Inspection tool, People's
      Voice section, and the Inspection Pack are all worth exploring if they have not yet become part of
      your routine.</p>
      <p>One question: you have been using AlwaysReady for a year now. What is the one thing you wish it
      did differently? Everything we build is shaped by what registered managers tell us. Hit reply and
      let us know.</p>
      <p>Thank you for being an AlwaysReady customer. We are genuinely glad you are here.</p>
    `,
  },
]
