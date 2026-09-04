'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { generateSupportDraft, type TicketThread } from '@/lib/ai-draft'
import { assertSuperadmin } from '@/lib/assert-superadmin'
import { getFirstName } from '@/lib/utils/name'

export type ReplyState =
  | { status: 'idle' }
  | { status: 'error'; message: string }

export async function staffReply(
  ticketId: string,
  _prev: ReplyState,
  formData: FormData
): Promise<ReplyState> {
  await assertSuperadmin()

  const message = (formData.get('message') as string | null)?.trim()
  if (!message) return { status: 'error', message: 'Message is required.' }

  const supabase = createAdminClient()

  // Fetch ticket to check source and get external contact details
  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('reference, subject, source, external_email, external_name')
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
  if (ticket && (ticket.source === 'website_contact' || ticket.source === 'website') && ticket.external_email) {
    const firstName = getFirstName(ticket.external_name)
    await sendEmail({
      to:      ticket.external_email,
      subject: `Re: ${ticket.subject} [${ticket.reference}]`,
      type:    'transactional',
      bodyHtml: `
        <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${firstName},</p>

        <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">
          Thank you for getting in touch. Here is our response to your enquiry:
        </p>

        <div style="margin:0 0 24px;padding:16px 20px;background:#f5f4f1;border-left:4px solid #014D4E;border-radius:4px;font-size:15px;line-height:1.7;color:#1a1a1a;white-space:pre-wrap">${message}</div>

        <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
          If you have any further questions, please reply to this email or visit
          <a href="https://www.alwaysready.uk" style="color:#014D4E">www.alwaysready.uk</a>.
        </p>
      `,
    })
  }

  // Refresh page
  redirect(`/superadmin/tickets/${ticketId}`)
}

export async function regenerateDraft(ticketId: string): Promise<string | null> {
  await assertSuperadmin()
  const supabase = createAdminClient()

  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('subject, message, external_name')
    .eq('id', ticketId)
    .single()

  if (!ticket) return null

  const { data: replies } = await supabase
    .from('support_ticket_replies')
    .select('message, is_staff_reply, created_at')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })

  const thread: TicketThread = {
    subject:         ticket.subject,
    senderName:      ticket.external_name ?? null,
    originalMessage: ticket.message,
    replies: (replies ?? []).map(r => ({
      role:      r.is_staff_reply ? 'staff' : 'customer',
      message:   r.message,
      createdAt: new Date(r.created_at).toLocaleDateString('en-GB'),
    })),
  }

  try {
    const draft = await generateSupportDraft(thread)
    await supabase
      .from('support_tickets')
      .update({ draft_reply: draft })
      .eq('id', ticketId)
    return draft
  } catch (err) {
    console.error('[regenerateDraft] AI draft failed:', err)
    return null
  }
}

// ── GDPR template names ───────────────────────────────────────────────────────

export type GdprTemplateName =
  | 'data-deletion-acknowledgement'
  | 'sar-acknowledgement'
  | 'sar-fulfilled'
  | 'sar-declined'

/**
 * Return a plain-text GDPR response template pre-filled with the ticket's
 * sender name, org name, and today's date. AJ edits before sending.
 */
export async function getTicketTemplate(
  ticketId: string,
  templateName: GdprTemplateName,
): Promise<string | null> {
  await assertSuperadmin()
  const supabase = createAdminClient()

  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('external_name, submitted_by, organisations ( name )')
    .eq('id', ticketId)
    .single()

  if (!ticket) return null

  // Resolve first name
  let firstName = 'there'
  if (ticket.external_name) {
    firstName = getFirstName(ticket.external_name)
  } else if (ticket.submitted_by) {
    const { data: profile } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', ticket.submitted_by)
      .single()
    if (profile?.full_name) firstName = getFirstName(profile.full_name)
  }

  // Resolve org name
  const t = ticket as unknown as { organisations: { name: string } | null }
  const orgName = t.organisations?.name ?? '[organisation name]'

  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  switch (templateName) {
    case 'data-deletion-acknowledgement':
      return `Dear ${firstName},

Thank you for your data deletion request, received on ${today}. We will process it in accordance with the UK GDPR and our Privacy Policy.

To verify your identity and confirm the request, please reply to this email with the following:

1. My full name is ___________________________________ and I am the account holder for the AlwaysReady account registered to ${orgName} (if applicable).
2. I am making this data subject request on my own behalf.
3. I confirm that I submitted this request.

Once we have received your confirmation, we will process your request within 30 days as required under UK GDPR Article 17. You will receive a separate email when your data has been deleted.

If you did not submit this request, please let us know immediately by replying to this email so we can protect your account.

If you have any questions, contact us at support@alwaysready.uk.

Kind regards,
AlwaysReady`

    case 'sar-acknowledgement':
      return `Dear ${firstName},

Thank you for your subject access request (SAR), received on ${today}. Under UK GDPR Article 15, you have the right to receive a copy of the personal data we hold about you. We will respond no later than ${deadline}.

Before we can release your data, we are required to verify your identity. Please reply to this email confirming the following:

1. My full name is ___________________________________ and I am the account holder for the AlwaysReady account registered to ${orgName} (if applicable).
2. I am making this subject access request on my own behalf.
3. I confirm that I submitted this request.

Once we have verified your identity, we will provide your data within the 30-day window required by law.

If you did not submit this request, please let us know immediately by replying to this email.

If you have any questions, contact us at support@alwaysready.uk.

Kind regards,
AlwaysReady`

    case 'sar-fulfilled':
      return `Dear ${firstName},

We have verified your identity and are writing to fulfil your subject access request, received on ${today}.

The personal data we hold about you is set out below. You can also download a full copy of your data by logging in to your account and using the Export my data button on the Account page.

Data we hold about you:
- Account details: name, email address, organisation name, registered address
- Subscription and billing information (payment data is held by Stripe, not AlwaysReady)
- Compliance records and evidence you have entered into the platform
- HR records associated with your account
- Files you have uploaded
- Email communication history with AlwaysReady support

Where your data came from: directly from you, via the platform and any email correspondence.
Why we process it: to provide the AlwaysReady service as described in our Privacy Policy.
Who can see it: AlwaysReady staff only. We do not sell your data or share it with third parties except as set out in our Privacy Policy.

If you believe any of your data is inaccurate or incomplete, you have the right to request a correction under UK GDPR Article 16. If you wish to have your data deleted, you may submit a deletion request by replying to this email.

If you are not satisfied with our response, you have the right to complain to the Information Commissioner's Office (ICO) at ico.org.uk or by calling 0303 123 1113.

If you have any questions, contact us at support@alwaysready.uk.

Kind regards,
AlwaysReady`

    case 'sar-declined':
      return `Dear ${firstName},

We are writing regarding your subject access request received on ${today}.

Unfortunately, we have been unable to fulfil your request at this time. We are required to verify the identity of anyone making a subject access request before releasing personal data. We did not receive a satisfactory response to our identity verification request.

If you still wish to receive a copy of your data, please reply to this email with confirmation of your identity as described in our earlier message. We will be happy to process your request once identity has been confirmed.

If you believe we have handled your request incorrectly, you have the right to complain to the Information Commissioner's Office (ICO) at ico.org.uk or by calling 0303 123 1113.

If you have any questions, contact us at support@alwaysready.uk.

Kind regards,
AlwaysReady`

    default:
      return null
  }
}

export async function updateTicketStatus(ticketId: string, status: string) {
  await assertSuperadmin()
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

      if ((ticket.source === 'website_contact' || ticket.source === 'website') && ticket.external_email) {
        // Website enquiry — email the external contact
        recipientEmail = ticket.external_email
        firstName = getFirstName(ticket.external_name)
      } else if (ticket.submitted_by) {
        // Platform user — look up their auth email and profile
        const { data: authUser } = await supabase.auth.admin.getUserById(ticket.submitted_by)
        const { data: profile } = await supabase
          .from('users')
          .select('full_name, personal_email')
          .eq('id', ticket.submitted_by)
          .single()

        recipientEmail = authUser?.user?.email ?? profile?.personal_email ?? null
        firstName = getFirstName(profile?.full_name)
      }

      if (recipientEmail) {
        await sendEmail({
          to:      recipientEmail,
          subject: `Your support request has been resolved [${ticket.reference}]`,
          type:    'transactional',
          bodyHtml: `
            <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">Hi ${firstName},</p>

            <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">
              Your support request has been resolved.
            </p>

            <div style="margin:0 0 24px;padding:16px 20px;background:#f5f4f1;border-left:4px solid #014D4E;border-radius:4px">
              <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:0.05em">Resolved request</p>
              <p style="margin:0 0 4px;font-size:13px;color:#888;font-family:monospace">${ticket.reference}</p>
              <p style="margin:0;font-size:15px;font-weight:600;color:#1a1a1a">${ticket.subject}</p>
            </div>

            <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">
              ${ticket.source === 'website_contact' || ticket.source === 'website'
                ? `If your issue has not been fully resolved or you have a follow-up question, please get in touch via <a href="https://alwaysready.uk/contact" style="color:#014D4E">alwaysready.uk/contact</a> and we'll be happy to help.`
                : `If your issue has not been fully resolved or you have a follow-up question, please open a new support ticket from the <strong>Support</strong> section inside the platform and we'll be happy to help.`
              }
            </p>

            <p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a">
              Thank you for using AlwaysReady. We hope we were able to help.
            </p>
          `,
        })
      }
    }
  }

  redirect(`/superadmin/tickets/${ticketId}`)
}
