'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'

const ACTIVE_SERVICE_TYPES = [
  'Residential Care Home',
  'Nursing Home',
  'Dual-Registered Care Home',
  'ARBD Specialist Care Home',
  'Homecare Agency',
  'Extra Care Housing',
  'Shared Lives Scheme',
  'Supported Living',
  'Specialist College',
  'Residential Rehabilitation Service',
  'Community Drug and Alcohol Service',
] as const

export type TrialSignupInput = {
  serviceName: string
  cqcLocationId: string
  serviceType: string
  managerName: string
  managerEmail: string
  marketingConsent: boolean
}

export type TrialSignupResult =
  | { success: true;  email: string }
  | { success: false; error: string }

export async function startTrial(input: TrialSignupInput): Promise<TrialSignupResult> {
  const { serviceName, cqcLocationId, serviceType, managerName, managerEmail, marketingConsent } = input

  // ── Validate ────────────────────────────────────────────────────────────────
  if (!serviceName.trim() || !cqcLocationId.trim() || !serviceType || !managerName.trim() || !managerEmail.trim()) {
    return { success: false, error: 'All fields are required.' }
  }
  if (!ACTIVE_SERVICE_TYPES.includes(serviceType as typeof ACTIVE_SERVICE_TYPES[number])) {
    return { success: false, error: 'Please select a valid service type.' }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(managerEmail.trim())) {
    return { success: false, error: 'Please enter a valid email address.' }
  }

  const supabase = createAdminClient()
  const baseUrl  = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://alwaysready-inspection-readiness-pl-three.vercel.app'

  // ── 1. Resolve service_type_id ───────────────────────────────────────────────
  const { data: serviceTypeRow, error: stError } = await supabase
    .from('service_types')
    .select('id')
    .eq('name', serviceType)
    .single()

  if (stError || !serviceTypeRow) {
    return { success: false, error: 'Could not resolve service type. Please try again.' }
  }

  // ── 2. Create organisation ───────────────────────────────────────────────────
  const trialExpiresAt = new Date()
  trialExpiresAt.setDate(trialExpiresAt.getDate() + 14)

  const { data: org, error: orgError } = await supabase
    .from('organisations')
    .insert({
      name:             serviceName.trim(),
      cqc_location_id:  cqcLocationId.trim(),
      service_type_id:  serviceTypeRow.id,
      subscription_tier: 'trial',
      trial_expires_at: trialExpiresAt.toISOString(),
      is_demo:          false,
    })
    .select('id')
    .single()

  if (orgError || !org) {
    return { success: false, error: 'Could not create your account. Please try again.' }
  }

  // ── 3. Create auth user (no password — set via email link) ───────────────────
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email:         managerEmail.trim(),
    email_confirm: true,
    user_metadata: { full_name: managerName.trim() },
  })

  if (authError || !authData.user) {
    await supabase.from('organisations').delete().eq('id', org.id)

    const msg = authError?.message ?? ''
    if (msg.includes('already registered') || msg.includes('already exists')) {
      return {
        success: false,
        error: 'An account with this email address already exists. Please sign in or contact support if you need help.',
      }
    }
    return { success: false, error: 'Could not create your account. Please try again.' }
  }

  const authUserId = authData.user.id

  // ── 4. Create public.users row ───────────────────────────────────────────────
  const emailPrefix = managerEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
  const username    = `${emailPrefix}_${Math.random().toString(36).slice(2, 6)}`

  const { error: userError } = await supabase.from('users').insert({
    id:                  authUserId,
    email:               managerEmail.trim(),
    full_name:           managerName.trim(),
    username,
    role:                'admin',
    organisation_id:     org.id,
    onboarding_complete: false,
    marketing_opt_out:   !marketingConsent, // GDPR: only opted in if they ticked the box
    marketing_consent:   marketingConsent ? true : null,
  })

  if (userError) {
    await supabase.auth.admin.deleteUser(authUserId)
    await supabase.from('organisations').delete().eq('id', org.id)
    return { success: false, error: 'Could not create your profile. Please try again.' }
  }

  // ── 5. Seed compliance_records (one per KLO item) ────────────────────────────
  const { data: klos } = await supabase.from('klo_items').select('id')
  if (klos && klos.length > 0) {
    const { error: crError } = await supabase.from('compliance_records').insert(
      klos.map(klo => ({ organisation_id: org.id, klo_item_id: klo.id }))
    )
    if (crError) console.error('[trial-signup] compliance_records seed error:', crError.message)
  }

  // ── 6. Generate password-setup link ─────────────────────────────────────────
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type:  'recovery',
    email: managerEmail.trim(),
    options: {
      redirectTo: `${baseUrl}/auth/callback?next=/login/new-password`,
    },
  })

  if (linkError) console.error('[trial-signup] generateLink error:', linkError.message)

  const setupLink = linkData?.properties?.action_link ?? `${baseUrl}/login`
  const firstName = managerName.trim().split(' ')[0]
  const expiry    = trialExpiresAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  // ── 7. Send branded welcome email ────────────────────────────────────────────
  await sendEmail({
    to:      managerEmail.trim(),
    subject: 'Your AlwaysReady trial is ready — set your password to get started',
    type:    'transactional',
    bodyHtml: `
      <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${firstName},</p>

      <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Your 14-day free trial of AlwaysReady is ready. Click the button below to
        set your password and get straight into your account.
      </p>

      <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">
        We have set up <strong style="color:#014D4E">${serviceName.trim()}</strong>
        with your CQC KLOE framework. You can start recording your compliance
        position, uploading evidence, and building your inspection readiness
        straight away.
      </p>

      <p style="margin:0 0 32px">
        <a href="${setupLink}"
           style="display:inline-block;background-color:#014D4E;color:#ffffff;
                  padding:14px 28px;border-radius:6px;font-size:15px;
                  font-weight:600;text-decoration:none">
          Set your password and get started &rarr;
        </a>
      </p>

      <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#555">
        Your trial runs until <strong>${expiry}</strong>.
        If you have any questions, use the <strong>Support</strong> tab inside
        the platform and we will get back to you within three business days.
      </p>

      <p style="margin:0;font-size:12px;color:#aaa;line-height:1.6">
        If the button above does not work, copy and paste this link into your browser:<br>
        <a href="${setupLink}" style="color:#014D4E;word-break:break-all">${setupLink}</a>
      </p>
    `,
  })

  return { success: true, email: managerEmail.trim() }
}
