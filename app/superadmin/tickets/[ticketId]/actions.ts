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

  redirect(`/superadmin/tickets/${ticketId}`)
}
