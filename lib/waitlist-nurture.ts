/**
 * Shared waitlist nurture email content.
 * Used by:
 *   - app/superadmin/test-emails/actions.ts  (preview)
 *   - app/api/inbound-waitlist/route.ts       (Email 1 on signup)
 *   - app/api/cron/waitlist-nurture/route.ts  (Emails 2–8, weekly)
 */

export interface NurtureEmail {
  subject: string
  bodyHtml: string
}

/**
 * Returns the subject and HTML body for a waitlist nurture email.
 * Returns null for an unknown email number.
 */
export function getWaitlistNurtureEmail(
  emailNum: number,
  firstName: string,
): NurtureEmail | null {
  switch (emailNum) {
    case 1:
      return {
        subject: 'Welcome to the AlwaysReady waitlist',
        bodyHtml: `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">Hi ${firstName},</p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">
        Thank you for joining. You're now on the AlwaysReady waitlist.
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">
        AlwaysReady is a governance platform for adult social care providers. It gives Registered
        Managers a single, structured space to track compliance, organise evidence, and maintain
        workforce records — all aligned to CQC's Adult Social Care Assessment Framework.
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">
        Over the next eight weeks, we'll send you a short series of updates. Each one covers a
        different aspect of inspection readiness: what CQC inspectors look for, how strong evidence
        gets built, and how AlwaysReady supports that work in practice. You'll be the first to hear
        when subscriptions open.
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">
        One thing before we go: what is the part of CQC compliance that takes up the most of your
        time right now? Just hit reply — we read every response, and it helps us make sure the
        updates we send are genuinely useful to you.
      </p>
      <p style="margin:0;font-size:16px;line-height:1.7;color:#111111">
        If you have any questions in the meantime, you can reach us at
        <a href="https://alwaysready.uk/contact" style="color:#014D4E">alwaysready.uk/contact</a>.
      </p>
    `,
      }

    case 2:
      return {
        subject: 'Why we built AlwaysReady',
        bodyHtml: `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">Hi ${firstName},</p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">
        Registered Managers lead complex services and oversee large, diverse teams. They have direct
        responsibility for the safety of vulnerable people. The role demands constant focus, sound
        judgement, and calm leadership under pressure. Resources are often limited, increasing strain
        on everyday governance.
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">
        The hardest part is rarely the care itself. It's the evidence. Good practice must be recorded
        clearly and consistently over time. That becomes difficult when records are scattered across
        spreadsheets, paper files, and shared drives. Each system is updated by different people, at
        different times, and in different formats. This creates gaps, duplication, and a fragmented record.
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">
        AlwaysReady gives that work a proper home. Compliance records update in real time as the work
        happens. Evidence links directly to the standard it supports. Each entry automatically builds a
        timestamped history. This creates a clear, chronological record of everyday practice.
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">
        The result is governance that reflects real-world work. It remains accurate, current, and easy
        to verify. A CQC inspector can see the evidence for themselves. They can follow each workflow
        and understand how the service operates.
      </p>
      <p style="margin:0;font-size:16px;line-height:1.7;color:#111111">
        One question before the next update: what does your current compliance record look like?
        Organised and up to date, or scattered across different systems? Just hit reply — we read
        every response.
      </p>
    `,
      }

    case 3:
      return {
        subject: 'How most services get caught out by CQC',
        bodyHtml: `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">Hi ${firstName},</p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">
        Most CQC inspections are unannounced. You can receive a call that morning.
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">
        The services that find this most stressful are the ones whose records don't reflect the
        quality of care they're actually providing. Staff are doing good work — but the documentation
        tells a different story. Policies are out of date. Review dates have lapsed. Evidence is
        scattered across shared drives and paper files.
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">
        When an inspector asks "can you show me your safeguarding evidence?" the answer shouldn't
        involve opening three folders and a spreadsheet.
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">
        AlwaysReady's KLOE tracker gives you a structured view of every Key Line of Enquiry across
        CQC's five key questions. For each KLOE, you can set a compliance status, record a review
        date, upload evidence directly, and assign it to a team member. The platform calculates your
        overall readiness position and shows you at a glance what needs attention.
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">
        The goal is simple: on any day of the year — including the one when you get that call —
        your records reflect your actual practice.
      </p>
      <p style="margin:0;font-size:16px;line-height:1.7;color:#111111">
        One question: when an inspector walks through your door, which area of your service feels
        least ready right now? Hit reply — we read every response.
      </p>
    `,
      }

    case 4:
      return {
        subject: "CQC's five key questions: what they mean in practice",
        bodyHtml: `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">Hi ${firstName},</p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">
        CQC's inspection framework is built around five key questions. These apply to every service
        and shape every line of enquiry an inspector pursues. Understanding what each one means shapes
        how you record and evidence your work throughout the year.
      </p>
      <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#014D4E">Safe</p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">
        People are protected from abuse, risks are assessed and managed, and safeguarding systems are
        robust and up to date. Safe staffing, meaning the right people in the right numbers, remains a
        consistent focus.
      </p>
      <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#014D4E">Effective</p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">
        People receive care based on good practice and evidence. This covers issues such as consent,
        nutrition, and hydration. It also covers whether staff have the training and skills to do
        their jobs well.
      </p>
      <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#014D4E">Caring</p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">
        People are treated with dignity and respect, their privacy is upheld, and they are involved in
        decisions about their care. CQC often assesses this by speaking with residents and their families.
      </p>
      <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#014D4E">Responsive</p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">
        CQC looks for evidence that care is centred on individuals rather than on what suits the
        organisation. For example, is care personalised, are complaints handled effectively, and does
        the service adapt to changing needs?
      </p>
      <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#014D4E">Well-led</p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">
        This covers the service's culture, quality-assurance processes, and incident learning. CQC
        also assesses how well leadership understands the service's strengths and risks. Without a
        verified audit and governance trail, high-quality daily care cannot be formally recognised.
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">
        AlwaysReady maps every feature to these five areas. The work you do on the platform aligns
        directly with what CQC assesses.
      </p>
      <p style="margin:0;font-size:16px;line-height:1.7;color:#111111">
        Which of these five areas is your biggest challenge right now? Hit reply and let us know —
        it helps us understand what to cover in future updates.
      </p>
    `,
      }

    case 5:
      return {
        subject: 'Safe staffing looks different on paper',
        bodyHtml: `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">Hi ${firstName},</p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">
        A care service can have exactly the right staff in post — experienced, trained, DBS-checked —
        and still receive a finding on safe staffing.
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">
        Not because the staffing is wrong. Because the records don't prove it.
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">
        CQC inspectors work from what they can see and verify. DBS check dates matter, but so does
        when the renewal was due and whether it happened on time. Training completion matters, but
        only if the certificate is current and accessible. Supervision matters, but only if there's
        a dated record showing it happened.
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">
        The gap between "we do this" and "we can prove we do this" is where most findings are made.
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">
        AlwaysReady's HR module keeps every workforce record in one place. For each team member, you
        can record DBS checks, training completion, supervision sessions, appraisal history, and
        absence episodes. The platform sends automatic reminders when a renewal is approaching — so
        the record stays current without you having to track it manually.
      </p>
      <p style="margin:0;font-size:16px;line-height:1.7;color:#111111">
        Is safe staffing something you feel confident evidencing right now, or is it an area with
        gaps? Hit reply — it helps us understand what to cover next.
      </p>
    `,
      }

    case 6:
      return {
        subject: 'What separates Good from Outstanding',
        bodyHtml: `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">Hi ${firstName},</p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">
        Two services. Both rated Good. Both providing safe, effective, caring care. One stays Good
        at the next inspection. The other reaches Outstanding. What changed?
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">
        In most cases, it was not the care. It was the evidence. Outstanding services build a trail
        that is dated, specific, and directly linked to outcomes. Inspectors can follow it step by
        step — seeing how decisions were made, what happened as a result, and what the service learned.
        They do not need to ask for an explanation. The record explains itself.
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">
        Outstanding services also record their learning, not just their activity. An incident report
        is a record. The learning cycle — what happened, what changed, what difference it made — is
        what Outstanding looks like. Inspectors want to see that reflection is happening, that it is
        documented, and that it leads somewhere.
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">
        The other thing Outstanding services have in common is that they do not prepare for
        inspections. They stay prepared. Their compliance record is current, organised, and
        accessible every day of the year — not just in the weeks before a visit.
      </p>
      <p style="margin:0;font-size:16px;line-height:1.7;color:#111111">
        Is Outstanding a realistic goal for your service, or are you focused on maintaining Good?
        Either is a valid answer — hit reply and let us know where you are.
      </p>
    `,
      }

    case 7:
      return {
        subject: 'What an inspector actually sees when they arrive',
        bodyHtml: `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">Hi ${firstName},</p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">
        When a CQC inspector arrives, they're not starting from zero. Before they speak to anyone,
        they've already reviewed your last inspection report, looked at your KLOEs, and formed an
        early picture of your service.
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">
        What changes that picture is what they find when they look more closely.
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">
        Two services with identical standards of care can receive different ratings. The difference
        is usually this: one can show its practice. The other can describe it.
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">
        Showing practice means having a dated, specific, accessible record. It means an inspector
        can open a KLOE and see when it was last reviewed, what evidence supports it, and what
        changed as a result. They don't need to ask you to explain — the record explains itself.
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">
        In AlwaysReady, every change to a KLOE is automatically logged: who made it, when, and
        what changed. Every evidence upload is timestamped and attached to the standard it
        demonstrates. Every review cycle is visible. The full history of your compliance position
        is always there.
      </p>
      <p style="margin:0;font-size:16px;line-height:1.7;color:#111111">
        When an inspector reviews your compliance record, what do you think they would see —
        and how confident are you in that record right now? Hit reply.
      </p>
    `,
      }

    case 8:
      return {
        subject: "Beta Partner places — if you'd like to get started now",
        bodyHtml: `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">Hi ${firstName},</p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">
        Over the past few weeks, we've covered what CQC inspectors look for, how strong evidence
        gets built, what separates Good from Outstanding, and why the gap between doing good care
        and proving it matters. If any of that felt relevant to where your service is right now,
        this update is for you.
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">
        AlwaysReady will be opening to new customers shortly after the publication of the new CQC
        Adult Social Care Assessment Framework. As a waitlist member, you'll be among the first
        to hear when that happens.
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">
        But there is something to consider now. We're opening a small number of Beta Partner places
        for providers who want to be part of AlwaysReady from the very beginning. Beta Partners
        share feedback on their experience, suggest features, and provide an honest review after
        their first month.
      </p>
      <p style="margin:0 0 20px;padding:20px 24px;background:#f0fdfb;border-left:4px solid #00b8a6;border-radius:4px">
        <strong style="color:#014D4E;font-size:15px">In return, Beta Partners receive:</strong><br><br>
        <ul style="margin:8px 0 0;padding-left:20px;font-size:16px;line-height:1.9;color:#111111">
          <li>A reduced subscription rate, locked in for life</li>
          <li>Input into new features — shaping what gets built next</li>
          <li>Early access to new features ahead of the wider market</li>
        </ul>
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">
        You don't need to do anything right now. When you start your free trial and reach the
        subscription step, the Beta Partner offer will be waiting — automatically unlocked and
        ready to claim.
      </p>
      <p style="margin:0;font-size:16px;line-height:1.7;color:#111111">
        Beta Partner places are limited. This is the best time to join — the new framework is
        coming, and the services that build their evidence base now will be the ones best placed
        when an inspector arrives.
      </p>
    `,
      }

    // ── Event-triggered emails (not part of the weekly sequence) ────────────────
    // Email 9: sent when CQC publishes the new framework date
    // Email 10: sent when AlwaysReady opens for new customers

    case 9:
      return {
        subject: 'The new CQC framework: what it means for your service',
        bodyHtml: `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">Hi ${firstName},</p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">
        CQC has now published the new Adult Social Care Assessment Framework, and it's worth
        understanding what changes — and what doesn't.
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">
        The five key questions are unchanged. Safe, Effective, Caring, Responsive, and Well-led
        remain the structure you're familiar with. What has shifted is what CQC expects to see as
        evidence. The new framework places greater emphasis on continuous, documented governance
        activity — not periodic reviews, but an ongoing record of how your service is managed.
        Services with consistent, structured evidence are better placed under the new framework
        from day one.
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">
        AlwaysReady maps directly to the new framework. Every KLOE reflects the updated structure,
        so from the moment you log in, your compliance tracker is aligned to what CQC will be looking
        for. We're also publishing a detailed breakdown on our blog — practical guidance on what the
        new framework means for each key question. We'll send you the link when it's live.
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">
        AlwaysReady is launching very soon. Before it does, I wanted to let you know that waitlist
        members will have the chance to join as a Beta Partner — a small group of services who get
        a deep discount in exchange for sharing feedback as the platform grows. I'll share the
        details when we launch.
      </p>
      <p style="margin:0;font-size:16px;line-height:1.7;color:#111111">
        If you have questions in the meantime, you can reach us at
        <a href="https://alwaysready.uk/contact" style="color:#014D4E">alwaysready.uk/contact</a>.
      </p>
    `,
      }

    case 10:
      return {
        subject: 'AlwaysReady is open — your access is ready',
        bodyHtml: `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">Hi ${firstName},</p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111111">
        AlwaysReady is now open. As a waitlist member, you have priority access — your 14-day
        free trial is available right now, and no payment is required until your trial ends.
      </p>
      <p style="margin:0 0 8px;font-size:16px;line-height:1.7;color:#111111">Your trial gives you full access to everything:</p>
      <ul style="margin:0 0 16px;padding-left:20px;font-size:16px;line-height:1.9;color:#111111">
        <li>KLOE tracker, pre-loaded with the new CQC framework</li>
        <li>Evidence uploads and document management</li>
        <li>HR module: staff records, DBS, training, supervision, and absence</li>
        <li>Team access: invite colleagues and assign KLOEs</li>
        <li>Readiness dashboard, mock inspection, and Evidence Pack</li>
      </ul>
      <p style="margin:0 0 32px">
        <a href="https://portal.alwaysready.uk/trial"
           style="display:inline-block;background-color:#014D4E;color:#ffffff;padding:14px 28px;border-radius:6px;font-size:16px;font-weight:600;text-decoration:none">
          Start your free 14-day trial &rarr;
        </a>
      </p>
      <p style="margin:0;font-size:16px;line-height:1.7;color:#111111">
        After your trial, a full subscription is <strong>£75/month</strong>. Cancel anytime.
        Charity discount applies automatically if you registered as a charity. If you have any
        questions before you start, reach us at
        <a href="https://alwaysready.uk/contact" style="color:#014D4E">alwaysready.uk/contact</a>.
      </p>
    `,
      }

    default:
      return null
  }
}
