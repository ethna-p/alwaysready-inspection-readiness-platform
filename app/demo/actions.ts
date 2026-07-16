'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export async function saveDemoLead(formData: FormData) {
  const firstName = (formData.get('first_name') as string | null)?.trim() ?? ''
  const lastName  = (formData.get('last_name')  as string | null)?.trim() ?? ''
  const email     = (formData.get('email')       as string | null)?.trim() ?? ''

  // Basic validation — if fields are missing, skip the insert but still start the demo
  if (firstName && lastName && email) {
    try {
      const admin = createAdminClient()
      await admin.from('demo_leads').insert({ first_name: firstName, last_name: lastName, email })
    } catch (err) {
      // Fail silently — never block the demo just because lead capture failed
      console.error('[demo_leads] insert failed:', err)
    }
  }

  redirect('/demo/start')
}
