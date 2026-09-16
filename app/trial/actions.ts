'use server'

import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { fetchCqcLocation } from '@/lib/cqc'
import { getFirstName } from '@/lib/utils/name'
import { createRateLimiter } from '@/lib/rate-limit'
import { escapeHtml } from '@/lib/utils/escape'
import { verifyTurnstile } from '@/lib/utils/turnstile'
import { renderTemplate } from '@/lib/email-templates'

// 3 trial signups per IP per hour: generous for legitimate use,
// prevents automated provisioning of many orgs from one address.
const trialSignupLimiter = createRateLimiter({ name: 'trial-signup', windowMs: 60 * 60_000, max: 3 })


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

// Current T&Cs version: bump this string whenever T&Cs are materially updated
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
  const tsResult = await verifyTurnstile(turnstileToken, '[trial]')
  if (!tsResult.ok) {
    return { success: false, error: tsResult.error }
  }

  // ── Rate limit: per IP, to prevent mass trial provisioning ────────────────
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
  //
  // This is also the platform's England-only gate: CQC regulates health and
  // social care exclusively in England -- Scotland, Wales, and Northern
  // Ireland have their own regulators (Care Inspectorate, CIW, RQIA) and
  // none of their locations exist on CQC's register. A location ID that
  // isn't a genuine, current English CQC registration can never resolve
  // here, so 'not_found' already means "not a CQC-registered English
  // provider" -- no separate address field or check is needed. The message
  // says so explicitly rather than just "check the ID and try again", so a
  // genuinely out-of-scope provider understands why, instead of assuming
  // they mistyped something.
  const cqcResult = await fetchCqcLocation(cqcLocationId.trim())
  if (cqcResult.status === 'not_found') {
    return {
      success: false,
      error: 'We could not find this CQC Location ID on the CQC register. AlwaysReady is only available to CQC-registered providers. CQC regulates health and social care services in England only. If you believe this is an error, please check your Location ID and try again, or contact support@alwaysready.uk.',
    }
  }
  // status === 'unavailable' → CQC API is temporarily down; allow signup to
  // proceed (see this file's step 9 and app/superadmin/organisations/page.tsx's
  // "CQC unverified" badge -- the org is flagged for manual review rather
  // than silently trusted, which covers this same England-only concern for
  // the rare case where CQC's outage coincides with a genuinely out-of-scope
  // signup attempt).

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

  // ── 3. Create auth user (no password, set via email link) ───────────────────
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
  // data now. If 'unavailable', skip: the dashboard stale-refresh will pick
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
    // klo_items is empty: this is an infrastructure problem, not a transient error.
    // Roll back and fail hard; the dashboard self-heal cannot fix a missing reference table.
    await supabase.auth.admin.deleteUser(authUserId)
    await supabase.from('organisations').delete().eq('id', org.id)
    console.error('[trial-signup] klo_items table is empty, cannot seed compliance records')
    return { success: false, error: 'Could not set up your account. Please try again.' }
  }

  const { error: crError } = await supabase.from('compliance_records').insert(
    klos.map(klo => ({ organisation_id: org.id, klo_item_id: klo.id }))
  )
  if (crError) {
    // Transient insert error: log and continue. The dashboard layout will self-heal
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
  // cqcResult (fetched in step 0) tells us whether this org's Location ID was
  // actually confirmed against the CQC register or just accepted on trust
  // because CQC's API was unavailable at the time (see step 0's comment: a
  // CQC outage must never block a legitimate signup, but that means an
  // unverified ID needs a human to check it, not silence).
  const cqcUnverified = cqcResult.status === 'unavailable'
  const superadminEmail = process.env.SUPERADMIN_EMAIL
  if (superadminEmail) {
    await sendEmail({
      to:      superadminEmail,
      subject: cqcUnverified
        ? `⚠️ New trial started (CQC unverified): ${serviceName.trim()}`
        : `New trial started: ${serviceName.trim()}`,
      type:    'transactional',
      bodyHtml: `
        <p style="margin:0 0 12px;font-size:15px;color:#1a1a1a">A new trial has started.</p>
        ${cqcUnverified ? `
        <p style="margin:0 0 18px;padding:12px 16px;background:#fffbeb;border:1px solid #fcd34d;border-radius:6px;font-size:14px;color:#92400e">
          <strong>CQC could not be reached to verify this Location ID at signup.</strong>
          The trial was allowed to proceed (a CQC outage must never block a legitimate
          signup), but this ID hasn't been confirmed against the CQC register yet:
          worth a manual check.
        </p>
        ` : ''}
        <table style="border-collapse:collapse;font-size:14px;color:#1a1a1a">
          <tr><td style="padding:4px 16px 4px 0;color:#555">Service</td><td style="padding:4px 0"><strong>${escapeHtml(serviceName.trim())}</strong></td></tr>
          <tr><td style="padding:4px 16px 4px 0;color:#555">Manager</td><td style="padding:4px 0">${escapeHtml(managerName.trim())}</td></tr>
          <tr><td style="padding:4px 16px 4px 0;color:#555">Email</td><td style="padding:4px 0">${escapeHtml(managerEmail.trim())}</td></tr>
          <tr><td style="padding:4px 16px 4px 0;color:#555">Service type</td><td style="padding:4px 0">${escapeHtml(serviceType)}</td></tr>
          <tr><td style="padding:4px 16px 4px 0;color:#555">CQC Location ID</td><td style="padding:4px 0">
            ${escapeHtml(cqcLocationId.trim())}
            ${cqcUnverified ? ` : <a href="https://www.cqc.org.uk/location/${encodeURIComponent(cqcLocationId.trim())}" style="color:#014D4E">check on CQC's site</a>` : ''}
          </td></tr>
          ${charityNumber ? `<tr><td style="padding:4px 16px 4px 0;color:#555">Charity no.</td><td style="padding:4px 0"><strong style="color:#b45309">${escapeHtml(charityNumber)}: verify document before enabling discount</strong></td></tr>` : ''}
          <tr><td style="padding:4px 16px 4px 0;color:#555">Trial expires</td><td style="padding:4px 0">${trialExpiresAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
        </table>
      `,
    })
  }

  // ── 10. Send branded welcome email ────────────────────────────────────────────
  const trialWelcomeParams = { firstName: escapeHtml(firstName), serviceName: escapeHtml(serviceName.trim()), expiry, setupLink }
  const defaultTrialWelcomeHtml = `
      <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear ${trialWelcomeParams.firstName},</p>

      <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">
        Your 14-day free trial of AlwaysReady is ready. Click the button below to
        set your password and get straight into your account.
      </p>

      <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">
        <strong style="color:#014D4E">${trialWelcomeParams.serviceName}</strong> has been configured
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
    `

  await sendEmail({
    to:      managerEmail.trim(),
    subject: 'Your AlwaysReady trial is ready: set your password to get started',
    type:    'transactional',
    bodyHtml: await renderTemplate('trial_signup_welcome', trialWelcomeParams, defaultTrialWelcomeHtml),
  })

  return { success: true, email: managerEmail.trim() }
}
