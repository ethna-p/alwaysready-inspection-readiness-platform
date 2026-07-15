'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

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

  const { error } = await supabase
    .from('support_ticket_replies')
    .insert({
      ticket_id: ticketId,
      sent_by: null,          // NULL = AJ / staff
      message,
      is_staff_reply: true,
    })

  if (error) return { status: 'error', message: error.message }

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
