'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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
    .select('organisation_id')
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
    .select('id')
    .single()

  if (error || !ticket) {
    return { status: 'error', message: 'Failed to submit ticket: ' + (error?.message ?? 'unknown error') }
  }

  redirect(`/dashboard/support/${ticket.id}`)
}
