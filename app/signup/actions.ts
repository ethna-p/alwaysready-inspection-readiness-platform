'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export type SignUpState =
  | { status: 'idle' }
  | { status: 'error'; message: string }

const SERVICE_TYPES = [
  'Residential Care Home',
  'Nursing Home',
  'Dual-Registered Care Home',
  'Domiciliary Care',
  'Supported Living',
  'Extra Care Housing',
  'Shared Lives',
]

export async function signUp(
  _prev: SignUpState,
  formData: FormData
): Promise<SignUpState> {
  const fullName    = (formData.get('full_name') as string | null)?.trim()
  const email       = (formData.get('email') as string | null)?.trim()
  const password    = (formData.get('password') as string | null)?.trim()
  const password2   = (formData.get('password2') as string | null)?.trim()
  const orgName     = (formData.get('org_name') as string | null)?.trim()
  const serviceType = (formData.get('service_type') as string | null)?.trim()

  // Validate
  if (!fullName || !email || !password || !password2 || !orgName || !serviceType) {
    return { status: 'error', message: 'All fields are required.' }
  }
  if (!SERVICE_TYPES.includes(serviceType)) {
    return { status: 'error', message: 'Please select a valid service type.' }
  }
  if (password.length < 8) {
    return { status: 'error', message: 'Password must be at least 8 characters.' }
  }
  if (password !== password2) {
    return { status: 'error', message: 'Passwords do not match.' }
  }

  const admin = createAdminClient()

  try {
    // 1. Resolve service_type_id
    const { data: serviceTypeRow, error: stError } = await admin
      .from('service_types')
      .select('id')
      .eq('name', serviceType)
      .single()

    if (stError || !serviceTypeRow) {
      return { status: 'error', message: 'Invalid service type. Please try again.' }
    }

    // 2. Create organisation with 7-day trial
    const trialExpiresAt = new Date()
    trialExpiresAt.setDate(trialExpiresAt.getDate() + 7)

    const { data: org, error: orgError } = await admin
      .from('organisations')
      .insert({
        name: orgName,
        service_type_id: serviceTypeRow.id,
        subscription_tier: 'trial',
        trial_expires_at: trialExpiresAt.toISOString(),
        is_demo: false,
      })
      .select('id')
      .single()

    if (orgError || !org) {
      return { status: 'error', message: 'Could not create your account. Please try again.' }
    }

    // 3. Create auth user (email pre-confirmed — no verification email)
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })

    if (authError || !authData.user) {
      await admin.from('organisations').delete().eq('id', org.id)
      // Surface duplicate email as a friendly message
      if (authError?.message?.toLowerCase().includes('already registered')) {
        return { status: 'error', message: 'An account with that email address already exists. Try logging in.' }
      }
      return { status: 'error', message: 'Could not create your account. Please try again.' }
    }

    const userId = authData.user.id

    // 4. Create public.users row
    const emailPrefix = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
    const username = `${emailPrefix}_${Math.random().toString(36).slice(2, 6)}`

    const { error: userError } = await admin.from('users').insert({
      id: userId,
      email,
      full_name: fullName,
      username,
      role: 'admin',
      organisation_id: org.id,
      onboarding_complete: false,
      marketing_consent: null,
    })

    if (userError) {
      await admin.auth.admin.deleteUser(userId)
      await admin.from('organisations').delete().eq('id', org.id)
      return { status: 'error', message: 'Could not create your account. Please try again.' }
    }

    // 5. Seed 24 compliance records
    const { data: klos } = await admin.from('klo_items').select('id')
    if (klos && klos.length > 0) {
      await admin.from('compliance_records').insert(
        klos.map(klo => ({ organisation_id: org.id, klo_item_id: klo.id }))
      )
    }

    // 6. Sign the user in (creates the session cookie)
    const supabase = await createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      // Account was created but sign-in failed — send them to login
      redirect('/login')
    }

  } catch (err) {
    return { status: 'error', message: 'Unexpected error: ' + String(err) }
  }

  redirect('/dashboard/welcome')
}
