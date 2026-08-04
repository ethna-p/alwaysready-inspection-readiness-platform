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
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${firstName},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Thank you for joining the AlwaysReady waitlist; we're really pleased to have you here.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        AlwaysReady is a governance platform for CQC-regulated adult social care providers. It provides
        Registered Managers with a single, structured space to track compliance, organise evidence,
        and maintain accurate workforce records. By bringing your governance activity into one place,
        AlwaysReady helps you turn everyday practice into clear, defensible evidence aligned with
        CQC's Adult Social Care Assessment Framework.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Our mission is simple: to make governance simpler, clearer, and easier to manage, so Registered
        Managers can focus on leading their service rather than wrestling with paperwork.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        As a waitlist member, you'll be the first to know when subscriptions officially open. If you've
        opted in to inspection-readiness updates, your first update will arrive next week. These updates
        will guide you through common CQC compliance challenges and highlight the platform's features.
        Each feature is designed to help you demonstrate safe, effective, caring, responsive, and
        well-led practice.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Each update is practical, focused, and grounded in real-world scenarios. You'll see how
        AlwaysReady supports the workflows you already use every day, and how those workflows translate
        directly into evidence the CQC recognises and values.
      </p>
      <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
        Everything we share is designed to help you feel more confident, more prepared, and more in
        control of your inspection readiness. If you have any questions, you can reach us online at
        <a href="https://alwaysready.uk/contact" style="color:#014D4E">alwaysready.uk/contact</a>.
      </p>
    `,
      }

    case 2:
      return {
        subject: 'Why we built AlwaysReady',
        bodyHtml: `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${firstName},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Registered Managers lead complex services and oversee large, diverse teams. They have direct
        responsibility for the safety of vulnerable people. The role demands constant focus, sound
        judgement, and calm leadership under pressure. Resources are often limited, increasing strain
        on everyday governance.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        The hardest part is rarely the care itself. It's the evidence. Good practice must be recorded
        clearly and consistently over time. That becomes difficult when records are scattered across
        spreadsheets, paper files, and shared drives. Each system is updated by different people, at
        different times, and in different formats. This creates gaps, duplication, and a fragmented record.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        AlwaysReady gives that work a proper home. Compliance records update in real time as the work
        happens. Evidence links directly to the standard it supports. Each entry automatically builds a
        timestamped history. This creates a clear, chronological record of everyday practice.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        The result is governance that reflects real-world work. It remains accurate, current, and easy
        to verify. A CQC inspector can see the evidence for themselves. They can follow each workflow
        and understand how the service operates.
      </p>
      <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
        Over the next few weeks, we'll show you exactly how it works.
      </p>
    `,
      }

    case 3:
      return {
        subject: 'How AlwaysReady tracks your KLOEs',
        bodyHtml: `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${firstName},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        At the heart of AlwaysReady is your KLOE tracker. It offers a structured view of every Key
        Line of Enquiry relevant to your service, organised around CQC's five key questions: Safe,
        Effective, Caring, Responsive, and Well-led.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        For each KLOE, you can:
      </p>
      <ul style="margin:0 0 24px;padding-left:24px;font-size:15px;line-height:1.9;color:#1a1a1a">
        <li><strong>Set a compliance status:</strong> Not Started, In Progress, or Completed</li>
        <li><strong>Record a review date</strong> and set a review frequency: monthly, quarterly, annually, or custom</li>
        <li><strong>Upload evidence:</strong> policies, audits, training records, meeting minutes, and more</li>
        <li><strong>Add notes:</strong> context that sits alongside the record for anyone who needs it</li>
        <li><strong>Assign the KLOE to a team member,</strong> with email notifications sent automatically</li>
      </ul>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Every change is timestamped and recorded in a permanent audit trail. The full history of each
        KLOE is available at any time: who updated it, when, and what changed.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        The platform calculates your overall readiness percentage and provides a breakdown by key
        question. At a glance, you can see where your service stands and which areas need attention.
      </p>
      <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
        Next time, we'll look at what CQC's five key questions mean in practice.
      </p>
    `,
      }

    case 4:
      return {
        subject: "CQC's five key questions: what they mean in practice",
        bodyHtml: `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${firstName},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        CQC's inspection framework is built around five key questions. These apply to every service
        and shape every line of enquiry an inspector pursues. Understanding what each one means shapes
        how you record and evidence your work throughout the year.
      </p>
      <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#014D4E">Safe</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        People are protected from abuse, risks are assessed and managed, and safeguarding systems are
        robust and up to date. Safe staffing, meaning the right people in the right numbers, remains a
        consistent focus.
      </p>
      <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#014D4E">Effective</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        People receive care based on good practice and evidence. This covers issues such as consent,
        nutrition, and hydration. It also covers whether staff have the training and skills to do
        their jobs well.
      </p>
      <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#014D4E">Caring</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        People are treated with dignity and respect, their privacy is upheld, and they are involved in
        decisions about their care. CQC often assesses this by speaking with residents and their families.
      </p>
      <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#014D4E">Responsive</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        CQC looks for evidence that care is centred on individuals rather than on what suits the
        organisation. For example, is care personalised, are complaints handled effectively, and does
        the service adapt to changing needs?
      </p>
      <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#014D4E">Well-led</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        This covers the service's culture, quality-assurance processes, and incident learning. CQC
        also assesses how well leadership understands the service's strengths and risks. Without a
        verified audit and governance trail, high-quality daily care cannot be formally recognised.
      </p>
      <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
        AlwaysReady maps every feature to these five areas. The work you do on the platform aligns
        directly with what CQC assesses.
      </p>
    `,
      }

    case 5:
      return {
        subject: 'Workforce records that hold up to scrutiny',
        bodyHtml: `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${firstName},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Workforce records are among the first items a CQC inspector reviews. DBS checks, mandatory
        training, supervision frequency, and appraisal history are central to safe and well-led care.
        When those records are spread across spreadsheets, paper files, and shared drives, gaps can arise.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        AlwaysReady's HR module keeps everything in one place. For each staff member, you can record
        the following details:
      </p>
      <ul style="margin:0 0 24px;padding-left:24px;font-size:15px;line-height:1.9;color:#1a1a1a">
        <li><strong>DBS checks:</strong> date, renewal date, and frequency tracking</li>
        <li><strong>Training records:</strong> course name, completion date, renewal date, and certificate upload</li>
        <li><strong>Supervision:</strong> date, next due, and frequency tracking</li>
        <li><strong>Appraisals:</strong> date, notes, and frequency tracking</li>
        <li><strong>Holiday allowance:</strong> annual entitlement tracked in either days or hours (set at organisation level)</li>
        <li><strong>Absence episodes,</strong> with return-to-work interview tracking</li>
      </ul>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        The platform sends automatic reminders when a DBS check or a training certificate is due for renewal.
      </p>
      <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
        Next week, we'll explore what separates Good from Outstanding.
      </p>
    `,
      }

    case 6:
      return {
        subject: 'What separates Good from Outstanding',
        bodyHtml: `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${firstName},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Services rated Good, by definition, deliver safe, effective, caring, responsive, and well-led
        care. The leap from Good to Outstanding rarely involves doing more work; it's about demonstrating
        the work with clarity, consistency, and confidence. Outstanding services don't just say what they
        do; they make their practice visible, traceable, and impossible to dispute.
      </p>
      <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#014D4E">Outstanding services show their practice, not just describe it</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        They build an evidence trail that is dated, specific, and directly linked to people's outcomes.
        Inspectors can follow it step by step, seeing how decisions were made and why they mattered.
        Rather than relying on a manager's verbal explanation, inspectors can see the evidence for themselves.
      </p>
      <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#014D4E">Outstanding services record their learning</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Learning is not assumed; it's documented. Inspectors look for evidence that the service has
        reflected on incidents, complaints, audits, and feedback. Outstanding services document what
        happened, what they learned, what they changed, and the difference it made. An incident report
        alone is merely a record; the learning cycle demonstrates improvement.
      </p>
      <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#014D4E">Outstanding governance is active year-round</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        An Outstanding Well-led rating is achieved in services where governance is woven into everyday
        practice. Leaders know their service intimately, including its strengths, risks, and blind spots.
        Audits occur regularly, risks are addressed proactively, and improvement is continuous rather
        than reactive. Governance is a living process.
      </p>
      <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#014D4E">Most inspections are unannounced</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Outstanding services don't scramble to prepare; they stay prepared. Their compliance record is
        current, organised, and accessible at all times. AlwaysReady was built to make year-round
        readiness the default, not the exception.
      </p>
      <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
        We've written more on this at
        <a href="https://alwaysready.uk/blog" style="color:#014D4E">alwaysready.uk/blog</a>.
      </p>
    `,
      }

    case 7:
      return {
        subject: 'Building an evidence trail that holds up',
        bodyHtml: `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${firstName},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Inspectors regularly encounter services where the quality of care is far better than the quality
        of the evidence record. Staff are doing good work, but the documentation doesn't reflect it.
        When the record falls short, the rating suffers.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        AlwaysReady is designed to close that gap by capturing evidence as you work. Here's what it
        looks like in practice.
      </p>
      <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#014D4E">Upload directly to each KLOE</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Every document is uploaded to the KLOE it relates to. If an inspector asks about safeguarding
        systems, you don't search through folders or emails; you open the safeguarding KLOE. The
        evidence is already there: dated, named, and attached to the exact standard it demonstrates.
        This removes ambiguity and shows inspectors exactly how your service meets the requirement.
      </p>
      <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#014D4E">The audit trail builds itself</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Every action, status update, evidence upload, review completion, and priority change is
        automatically logged. The system records the date, time, and the person responsible for the
        update, creating a permanent, tamper-proof audit trail. Inspectors don't just see what you
        did; they see when, why, and who made it happen.
      </p>
      <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#014D4E">Your Evidence Pack is one click away</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        At any time, you can generate a complete, printable PDF of your compliance position. It
        includes RAG ratings, review dates, priorities, and evidence notes for each KLOE. Whether
        you're facing an unannounced inspection or presenting to your board, your full compliance
        story is instantly ready.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        When evidence is captured as you work, inspectors see the same record they would on any
        other day of the year. No scrambling. No reconstruction. No guesswork. Just a clear, credible,
        real-time view of how your service operates.
      </p>
      <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
        Next week, I will be sharing details of a one-off special offer (I hope) you'll find hard to resist.
      </p>
    `,
      }

    case 8:
      return {
        subject: "Beta Partner places — if you'd like to get started now",
        bodyHtml: `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${firstName},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        The countdown has begun. We're approaching the publication date of the new CQC Adult Social
        Care Assessment Framework — a moment the entire sector has been waiting for. Shortly after
        publication, AlwaysReady will open to new customers. As a waitlist member, you will be among
        the first to hear about the launch.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        There's something even more exciting. We're opening a small number of Beta Partner places for
        providers who want to be part of AlwaysReady from the very beginning. Beta Partners share
        feedback on their experience with the platform, suggest additional features they would like,
        and, after a month or so, provide an honest review.
      </p>
      <p style="margin:0 0 20px;padding:20px 24px;background:#f0fdfb;border-left:4px solid #00b8a6;border-radius:4px">
        <strong style="color:#014D4E;font-size:15px">In return, Beta Partners receive:</strong><br><br>
        <ul style="margin:8px 0 0;padding-left:20px;font-size:15px;line-height:1.9;color:#1a1a1a">
          <li>A reduced subscription rate, locked in for life</li>
          <li>Input into new features — shaping what gets built next</li>
          <li>Early access to new features ahead of the wider market</li>
        </ul>
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#1a1a1a">
        You don't need to take any action right now. When you complete your free trial and reach the
        subscription step, the Beta Partner offer will be waiting for you — automatically unlocked
        and ready to claim.
      </p>
      <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
        The window for Beta Partners is limited, and the timing is tight. With the new CQC assessment
        framework about to be introduced, this is your chance to join AlwaysReady and help shape the
        platform's future.
      </p>
    `,
      }

    default:
      return null
  }
}
