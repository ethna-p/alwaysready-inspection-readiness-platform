'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import { getFirstName } from '@/lib/utils/name'

export type SubmitTicketState =
  | { status: 'idle' }
  | { status: 'error'; message: string }

export async function submitTicket(
  _prev: SubmitTicketState,
  formData: FormData
): Promise<SubmitTicketState> {
  const subject = (formData.get('subject') as string | null)?.trim()
  const message = (formData.get('message') as string | null)?.trim()

  if (!subject || !message) {
    return { status: 'error', message: 'Subject and message are required.' }
  }
  if (message.length < 20) {
    return { status: 'error', message: 'Please provide a little more detail in your message (at least 20 characters).' }
  }

  const profile = await requireUser()
  if (!profile) return { status: 'error', message: 'Not authenticated.' }

  const supabase = await createClient()

  const { data: profileDetails } = await supabase
    .from('users')
    .select('full_name, personal_email')
    .eq('id', profile.id)
    .single()

  const { data: ticket, error } = await supabase
    .from('support_tickets')
    .insert({
      organisation_id: profile.organisation_id,
      submitted_by: profile.id,
      subject,
      message,
    })
    .select('id, reference')
    .single()

  if (error || !ticket) {
    return { status: 'error', message: 'Failed to submit ticket: ' + (error?.message ?? 'unknown error') }
  }

  // Send auto-responder to the submitter (if we have an email address for them)
  const recipientEmail = profile.email ?? profileDetails?.personal_email ?? null
  if (recipientEmail) {
    const firstName = getFirstName(profileDetails?.full_name)
    await sendEmail({
      to:      recipientEmail,
      subject: `We've received your support request — ${ticket.reference}`,
      type:    'transactional',
      bodyHtml: `
        <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">Hi ${firstName},</p>

        <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">
          Thank you for getting in touch. We've received your support request and will get back to you as soon as possible.
        </p>

        <div style="margin:0 0 24px;padding:16px 20px;background:#f5f4f1;border-left:4px solid #014D4E;border-radius:4px">
          <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:0.05em">Your request</p>
          <p style="margin:0 0 4px;font-size:13px;color:#888;font-family:monospace">${ticket.reference}</p>
          <p style="margin:0;font-size:15px;font-weight:600;color:#1a1a1a">${subject}</p>
        </div>

        <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
          You can reply to this email directly, or visit the <strong>Support</strong> section
          inside AlwaysReady to view your request and any replies.
        </p>
      `,
    })
  }

  // Notify AJ of new platform support ticket
  const superadminEmail = process.env.SUPERADMIN_EMAIL
  if (superadminEmail) {
    const { data: org } = await supabase
      .from('organisations')
      .select('name')
      .eq('id', profile.organisation_id)
      .single()

    await sendEmail({
      to:      superadminEmail,
      subject: `New support ticket [${ticket.reference}]: ${subject}`,
      type:    'transactional',
      bodyHtml: `
        <p style="margin:0 0 12px;font-size:15px;color:#1a1a1a">A new support ticket has been submitted via the platform.</p>
        <table style="border-collapse:collapse;font-size:14px;color:#1a1a1a">
          <tr><td style="padding:4px 16px 4px 0;color:#555">Reference</td><td style="padding:4px 0;font-family:monospace">${ticket.reference}</td></tr>
          <tr><td style="padding:4px 16px 4px 0;color:#555">Organisation</td><td style="padding:4px 0">${org?.name ?? '—'}</td></tr>
          <tr><td style="padding:4px 16px 4px 0;color:#555">Submitted by</td><td style="padding:4px 0">${profileDetails?.full_name ?? profile.email ?? '—'}</td></tr>
          <tr><td style="padding:4px 16px 4px 0;color:#555">Subject</td><td style="padding:4px 0"><strong>${subject}</strong></td></tr>
        </table>
        <p style="margin:16px 0 0;font-size:14px;color:#555;white-space:pre-wrap">${message}</p>
      `,
    })
  }

  redirect(`/dashboard/support/${ticket.id}`)
}
