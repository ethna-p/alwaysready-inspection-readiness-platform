'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { assertSuperadmin } from '@/lib/assert-superadmin'
import { revalidatePath } from 'next/cache'

export async function deleteResolvedTickets(): Promise<{ deleted: number; error: string | null }> {
  await assertSuperadmin()
  const supabase = createAdminClient()

  // Delete replies first (FK constraint)
  const { data: resolved } = await supabase
    .from('support_tickets')
    .select('id')
    .eq('status', 'resolved')

  if (!resolved || resolved.length === 0) {
    return { deleted: 0, error: null }
  }

  const ids = resolved.map(t => t.id)

  const { error: repliesError } = await supabase
    .from('support_ticket_replies')
    .delete()
    .in('ticket_id', ids)

  if (repliesError) {
    return { deleted: 0, error: repliesError.message }
  }

  const { error: ticketsError } = await supabase
    .from('support_tickets')
    .delete()
    .eq('status', 'resolved')

  if (ticketsError) {
    return { deleted: 0, error: ticketsError.message }
  }

  revalidatePath('/superadmin/tickets')
  return { deleted: ids.length, error: null }
}
