'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const marketingConsent = formData.get('marketing_consent') === 'on'

  const { error } = await supabase
    .from('users')
    .update({
      onboarding_complete: true,
      marketing_consent: marketingConsent,
      marketing_consent_at: marketingConsent ? new Date().toISOString() : null,
    })
    .eq('id', user.id)

  if (error) throw new Error('Failed to save preferences: ' + error.message)

  redirect('/dashboard')
}
