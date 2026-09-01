'use server'

import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { fetchCqcLocation } from '@/lib/cqc'
import { getFirstName } from '@/lib/utils/name'
import { createRateLimiter } from '@/lib/rate-limit'

// 3 trial signups per IP per hour — generous for legitimate use,
// prevents automated provisioning of many orgs from one address.
const trialSignupLimiter = createRateLimiter({ windowMs: 60 * 60_000, max: 3 })

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

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

// Current T&Cs version — bump this string whenever T&Cs are materially updated
// so the platform can identify which version each org accepted.
const TERMS_VERSION = 'v1.0'

export type TrialSignupInput = {
  serviceName: string
  cqcLocationId: string
  serviceType: string
  managerName: string
  managerEmail: string
  charityNumber: string | null
  marketingConsent: boolean
  termsAccepted: boolean
  turnstileToken?: string
}

export type TrialSignupResult =
  | { success: true;  email: string }
  | { success: false; error: string }

export async function startTrial(input: TrialSignupInput): Promise<TrialSignupResult> {
  const { serviceName, cqcLocationId, serviceType, managerName, managerEmail, charityNumber, marketingConsent, termsAccepted, turnstileToken } = input

  // ── Turnstile verification ───────────────────────────────────────────────────
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY
  if (turnstileSecret) {
    if (!turnstileToken) {
      return { success: false, error: 'Security check required. Please complete the verification and try again.' }
    }
    try {
      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${encodeURIComponent(turnstileSecret)}&response=${encodeURIComponent(turnstileToken)}`,
      })
      const verifyData = await verifyRes.json() as { success: boolean }
      if (!verifyData.success) {
        return { success: false, error: 'Security check failed. Please refresh the page and try again.' }
      }
    } catch {
      return { success: false, error: 'Security check unavailable. Please try again in a moment.' }
    }
  }

  // ── Rate limit — per IP, to prevent mass trial provisioning ────────────────
  const headersList = await headers()
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0].trim() ??
    headersList.get('x-real-ip') ??
    'unknown'
  if (!(await trialSignupLimiter.check(`trial:${ip}`))) {
    return { success: false, error: 'Too many signup attempts. Please try again later.' }
  }

  // ── Validate ────────────────────────────────────────────────────────────────
  if (!serviceName.trim() || !cqcLocationId.trim() || !serviceType || !managerName.trim() || !managerEmail.trim()) {
    return { success: false, error: 'All fields are required.' }
  }
  if (!termsAccepted) {
    return { success: false, error: 'You must accept the Terms & Conditions to start your trial.' }
  }
  if (!ACTIVE_SERVICE_TYPES.includes(serviceType as typeof ACTIVE_SERVICE_TYPES[number])) {
    return { success: false, error: 'Please select a valid service type.' }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(managerEmail.trim())) {
    return { success: false, error: 'Please enter a valid email address.' }
  }

  const supabase = createAdminClient()
  const baseUrl  = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://portal.alwaysready.uk'

  // ── 0. Validate CQC Location ID ─────────────────────────────────────────────
  // Fetch now so we can (a) hard-block non-registered IDs and (b) reuse the
  // data for enrichment in step 5, avoiding a second API call.
  const cqcResult = await fetchCqcLocation(cqcLocationId.trim())
  if (cqcResult.status === 'not_found') {
    return {
      success: false,
      error: 'Your CQC Location ID could not be found on the CQC register. Please check it and try again.',
    }
  }
  // status === 'unavailable' → CQC API is temporarily down; allow signup to proceed

  // ── 1. Resolve service_type_id ───────────────────────────────────────────────
  const { data: serviceTypeRow, error: stError } = await supabase
    .from('service_types')
    .select('id')
    .eq('name', serviceType)
    .single()

  if (stError || !serviceTypeRow) {
    return { success: false, error: 'Could not resolve service type. Please try again.' }
  }

  // ── 1b. Block duplicate CQC Location ID ──────────────────────────────────────
  // The unique index (migration 00007) enforces this at the DB level, but a
  // pre-check here lets us return a friendly message rather than a raw error.
  if (cqcLocationId.trim()) {
    const { data: existingOrg } = await supabase
      .from('organisations')
      .select('id')
      .eq('cqc_location_id', cqcLocationId.trim())
      .maybeSingle()

    if (existingOrg) {
      return {
        success: false,
        error: 'An account for this CQC location already exists. If you need access, please contact support.',
      }
    }
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
      trial_expires_at:  trialExpiresAt.toISOString(),
      terms_accepted_at: new Date().toISOString(),
      terms_version:     TERMS_VERSION,
      ...(charityNumber ? { charity_number: charityNumber } : {}),
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
  const { error: userError } = await supabase.from('users').insert({
    id:                  authUserId,
    email:               managerEmail.trim(),
    full_name:           managerName.trim(),
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

  // ── 5. Enrich org with CQC data ─────────────────────────────────────────────
  // cqcResult was fetched in step 0. If it came back as 'found', persist the
  // data now. If 'unavailable', skip — the dashboard stale-refresh will pick
  // it up on first login.
  if (cqcResult.status === 'found') {
    try {
      await supabase
        .from('organisations')
        .update({
          cqc_location_name:        cqcResult.data.locationName,
          cqc_rating:               cqcResult.data.overallRating,
          cqc_last_inspection_date: cqcResult.data.lastInspectionDate,
          cqc_rating_fetched_at:    new Date().toISOString(),
        })
        .eq('id', org.id)
    } catch (err) {
      console.warn('[trial-signup] CQC enrichment update failed (non-fatal):', err)
    }
  }

  // ── 7. Seed compliance_records (one per KLO item) ────────────────────────────
  const { data: klos } = await supabase.from('klo_items').select('id')
  if (!klos || klos.length === 0) {
    // klo_items is empty — this is an infrastructure problem, not a transient error.
    // Roll back and fail hard; the dashboard self-heal cannot fix a missing reference table.
    await supabase.auth.admin.deleteUser(authUserId)
    await supabase.from('organisations').delete().eq('id', org.id)
    console.error('[trial-signup] klo_items table is empty — cannot seed compliance records')
    return { success: false, error: 'Could not set up your account. Please try again.' }
  }

  const { error: crError } = await supabase.from('compliance_records').insert(
    klos.map(klo => ({ organisation_id: org.id, klo_item_id: klo.id }))
  )
  if (crError) {
    // Transient insert error — log and continue. The dashboard layout will self-heal
    // by re-seeding on the user's first login via lib/seed-compliance.ts.
    console.error('[trial-signup] compliance_records seed error (will self-heal on login):', crError.message)
  }

  // ── 8. Generate password-setup link ─────────────────────────────────────────
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type:  'recovery',
    email: managerEmail.trim(),
    options: {
      redirectTo: `${baseUrl}/auth/callback?next=/login/new-password`,
    },
  })

  if (linkError) console.error('[trial-signup] generateLink error:', linkError.message)

  const setupLink = linkData?.properties?.action_link ?? `${baseUrl}/login`
  const firstName = getFirstName(managerName.trim())
  const expiry    = trialExpiresAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  // ── 9. Notify AJ of new trial signup ────────────────────────────────────────
  const superadminEmail = process.env.SUPERADMIN_EMAIL
  if (superadminEmail) {
    await sendEmail({
      to:      superadminEmail,
      subject: `New trial started: ${serviceName.trim()}`,
      type:    'transactional',
      bodyHtml: `
        <p style="margin:0 0 12px;font-size:15px;color:#1a1a1a">A new trial has started.</p>
        <table style="border-collapse:collapse;font-size:14px;color:#1a1a1a">
          <tr><td style="padding:4px 16px 4px 0;color:#555">Service</td><td style="padding:4px 0"><strong>${escapeHtml(serviceName.trim())}</strong></td></tr>
          <tr><td style="padding:4px 16px 4px 0;color:#555">Manager</td><td style="padding:4px 0">${escapeHtml(managerName.trim())}</td></tr>
          <tr><td style="padding:4px 16px 4px 0;color:#555">Email</td><td style="padding:4px 0">${escapeHtml(managerEmail.trim())}</td></tr>
          <tr><td style="padding:4px 16px 4px 0;color:#555">Service type</td><td style="padding:4px 0">${escapeHtml(serviceType)}</td></tr>
          <tr><td style="padding:4px 16px 4px 0;color:#555">CQC Location ID</td><td style="padding:4px 0">${escapeHtml(cqcLocationId.trim())}</td></tr>
          ${charityNumber ? `<tr><td style="padding:4px 16px 4px 0;color:#555">Charity no.</td><td style="padding:4px 0"><strong style="color:#b45309">${escapeHtml(charityNumber)} — verify document before enabling discount</strong></td></tr>` : ''}
          <tr><td style="padding:4px 16px 4px 0;color:#555">Trial expires</td><td style="padding:4px 0">${trialExpiresAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
        </table>
      `,
    })
  }

  // ── 10. Send branded welcome email ────────────────────────────────────────────
  await sendEmail({
    to:      managerEmail.trim(),
    subject: 'Your AlwaysReady trial is ready — set your password to get started',
    type:    'transactional',
    bodyHtml: `
      <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${escapeHtml(firstName)},</p>

      <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Your 14-day free trial of AlwaysReady is ready. Click the button below to
        set your password and get straight into your account.
      </p>

      <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">
        <strong style="color:#014D4E">${escapeHtml(serviceName.trim())}</strong> has been configured
        to your service type using the CQC Adult Social Care Assessment Framework. You can
        start recording your compliance position, uploading evidence, and building your
        inspection readiness straight away.
      </p>

      <p style="margin:0 0 32px">
        <a href="${setupLink}"
           style="display:inline-block;background-color:#014D4E;color:#ffffff;
                  padding:14px 28px;border-radius:6px;font-size:15px;
                  font-weight:600;text-decoration:none">
          Set your password and get started &rarr;
        </a>
      </p>

      <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Your trial runs until <strong>${expiry}</strong>.
        If you have any questions, use the <strong>Support</strong> tab inside
        the platform and we will get back to you shortly.
      </p>

      <p style="margin:0;font-size:12px;color:#aaa;line-height:1.6">
        If the button above does not work, copy and paste this link into your browser:<br>
        <a href="${setupLink}" style="color:#014D4E;word-break:break-all">${setupLink}</a>
      </p>
    `,
  })

  return { success: true, email: managerEmail.trim() }
}
