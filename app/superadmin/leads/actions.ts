'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function deleteLead(id: string) {
  const supabase = createAdminClient()
  await supabase.from('waitlist_leads').delete().eq('id', id)
  revalidatePath('/superadmin/leads')
}
