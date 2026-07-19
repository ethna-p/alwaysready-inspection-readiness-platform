'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'

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

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 'error', message: 'Not authenticated.' }

  const { data: profile } = await supabase
    .from('users')
    .select('organisation_id, full_name, personal_email')
    .eq('id', user.id)
    .single()

  if (!profile?.organisation_id) {
    return { status: 'error', message: 'Could not determine your organisation.' }
  }

  const { data: ticket, error } = await supabase
    .from('support_tickets')
    .insert({
      organisation_id: profile.organisation_id,
      submitted_by: user.id,
      subject,
      message,
    })
    .select('id, reference')
    .single()

  if (error || !ticket) {
    return { status: 'error', message: 'Failed to submit ticket: ' + (error?.message ?? 'unknown error') }
  }

  // Send auto-responder to the submitter (if we have an email address for them)
  const recipientEmail = user.email ?? profile.personal_email ?? null
  if (recipientEmail) {
    const firstName = profile.full_name?.split(' ')[0] ?? 'there'
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

        <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">
          You can view your request and any replies at any time by logging into AlwaysReady and visiting the
          <strong>Support</strong> section in the navigation bar.
        </p>

        <p style="margin:0;font-size:14px;line-height:1.6;color:#555">
          Please do not reply to this email — all correspondence should go through the support desk inside the platform.
        </p>
      `,
    })
  }

  redirect(`/dashboard/support/${ticket.id}`)
}
