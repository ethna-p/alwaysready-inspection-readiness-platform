/**
 * GET /api/cron/waitlist-nurture
 *
 * Daily cron (10:00 UTC) that sends the waitlist nurture sequence.
 *
 * Email schedule:
 *   Email 1 — sent immediately on signup (inbound-waitlist route)
 *   Emails 2–8 — sent weekly, one per week, by this cron
 *
 * Eligibility query:
 *   nurture_opt_in = true
 *   nurture_emails_sent >= 1 (Email 1 already sent)
 *   nurture_emails_sent < 8  (sequence not yet complete)
 *   nurture_last_sent_at < now() - 7 days
 *
 * Protected by CRON_SECRET (Vercel sends this automatically for registered crons).
 */

import 'server-only'
import { NextResponse }                  from 'next/server'
import { createAdminClient }             from '@/lib/supabase/admin'
import { sendEmail }                     from '@/lib/email'
import { getWaitlistNurtureEmail }       from '@/lib/waitlist-nurture'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const secret     = process.env.CRON_SECRET
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Fetch leads due for their next nurture email
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: leads, error: leadsError } = await supabase
    .from('waitlist_leads')
    .select('id, email, first_name, nurture_emails_sent')
    .eq('nurture_opt_in', true)
    .gte('nurture_emails_sent', 1)
    .lt('nurture_emails_sent', 8)
    .lt('nurture_last_sent_at', sevenDaysAgo)

  if (leadsError || !leads) {
    console.error('[waitlist-nurture] Failed to fetch leads:', leadsError)
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }

  let emailsSent    = 0
  let emailsSkipped = 0
  const errors: string[] = []

  for (const lead of leads) {
    const nextEmailNum = lead.nurture_emails_sent + 1

    const emailContent = getWaitlistNurtureEmail(nextEmailNum, lead.first_name || 'there')
    if (!emailContent) {
      emailsSkipped++
      continue
    }

    try {
      await sendEmail({
        to:              lead.email,
        subject:         emailContent.subject,
        type:            'marketing',
        subscriberEmail: lead.email,
        bodyHtml:        emailContent.bodyHtml,
      })

      const { error: updateError } = await supabase
        .from('waitlist_leads')
        .update({
          nurture_emails_sent:   nextEmailNum,
          nurture_last_sent_at:  new Date().toISOString(),
        })
        .eq('id', lead.id)

      if (updateError) {
        console.error(`[waitlist-nurture] Failed to update lead ${lead.id}:`, updateError.message)
        errors.push(lead.email)
      } else {
        emailsSent++
      }
    } catch (err) {
      console.error(`[waitlist-nurture] Failed to send email to ${lead.email}:`, err)
      errors.push(lead.email)
    }
  }

  return NextResponse.json({
    ok:           true,
    emailsSent,
    emailsSkipped,
    errors,
  })
}
