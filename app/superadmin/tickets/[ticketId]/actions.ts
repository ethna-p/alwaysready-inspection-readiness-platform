'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'

export type ReplyState =
  | { status: 'idle' }
  | { status: 'error'; message: string }

export async function staffReply(
  ticketId: string,
  _prev: ReplyState,
  formData: FormData
): Promise<ReplyState> {
  const message = (formData.get('message') as string | null)?.trim()
  if (!message) return { status: 'error', message: 'Message is required.' }

  const supabase = createAdminClient()

  // Fetch ticket to check source and get external contact details
  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('subject, source, external_email, external_name')
    .eq('id', ticketId)
    .single()

  const { error } = await supabase
    .from('support_ticket_replies')
    .insert({
      ticket_id: ticketId,
      sent_by: null,          // NULL = AJ / staff
      message,
      is_staff_reply: true,
    })

  if (error) return { status: 'error', message: error.message }

  // If this is a website enquiry, email the reply to the external sender
  if (ticket?.source === 'website' && ticket.external_email) {
    const firstName = ticket.external_name?.split(' ')[0] ?? 'there'
    await sendEmail({
      to:      ticket.external_email,
      subject: `Re: ${ticket.subject}`,
      type:    'transactional',
      bodyHtml: `
        <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${firstName},</p>

        <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">
          Thank you for getting in touch. Here is our response to your enquiry:
        </p>

        <div style="margin:0 0 24px;padding:16px 20px;background:#f5f4f1;border-left:4px solid #014D4E;border-radius:4px;font-size:15px;line-height:1.7;color:#1a1a1a;white-space:pre-wrap">${message}</div>

        <p style="margin:0;font-size:14px;line-height:1.6;color:#555">
          If you have any further questions, please reply to this email or visit
          <a href="https://www.alwaysready.uk" style="color:#014D4E">www.alwaysready.uk</a>.
        </p>
      `,
    })
  }

  // Refresh page
  redirect(`/superadmin/tickets/${ticketId}`)
}

export async function updateTicketStatus(ticketId: string, status: string) {
  const supabase = createAdminClient()
  const validStatus = status as 'open' | 'in_progress' | 'resolved'

  await supabase
    .from('support_tickets')
    .update({ status: validStatus })
    .eq('id', ticketId)

  // Send closure email when a ticket is marked as resolved
  if (validStatus === 'resolved') {
    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('reference, subject, source, submitted_by, external_email, external_name')
      .eq('id', ticketId)
      .single()

    if (ticket) {
      let recipientEmail: string | null = null
      let firstName = 'there'

      if (ticket.source === 'website' && ticket.external_email) {
        // Website enquiry — email the external contact
        recipientEmail = ticket.external_email
        firstName = ticket.external_name?.split(' ')[0] ?? 'there'
      } else if (ticket.submitted_by) {
        // Platform user — look up their auth email and profile
        const { data: authUser } = await supabase.auth.admin.getUserById(ticket.submitted_by)
        const { data: profile } = await supabase
          .from('users')
          .select('full_name, personal_email')
          .eq('id', ticket.submitted_by)
          .single()

        recipientEmail = authUser?.user?.email ?? profile?.personal_email ?? null
        firstName = profile?.full_name?.split(' ')[0] ?? 'there'
      }

      if (recipientEmail) {
        await sendEmail({
          to:      recipientEmail,
          subject: `Your support request has been resolved — ${ticket.reference}`,
          type:    'transactional',
          bodyHtml: `
            <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">Hi ${firstName},</p>

            <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">
              We're getting in touch to let you know that your support request has been marked as resolved.
            </p>

            <div style="margin:0 0 24px;padding:16px 20px;background:#f5f4f1;border-left:4px solid #014D4E;border-radius:4px">
              <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:0.05em">Resolved request</p>
              <p style="margin:0 0 4px;font-size:13px;color:#888;font-family:monospace">${ticket.reference}</p>
              <p style="margin:0;font-size:15px;font-weight:600;color:#1a1a1a">${ticket.subject}</p>
            </div>

            <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">
              If your issue has not been fully resolved or you have a follow-up question, please open a new support
              ticket from the <strong>Support</strong> section inside the platform and we'll be happy to help.
            </p>

            <p style="margin:0;font-size:14px;line-height:1.6;color:#555">
              Thank you for using AlwaysReady. We hope we were able to help.
            </p>
          `,
        })
      }
    }
  }

  redirect(`/superadmin/tickets/${ticketId}`)
}
