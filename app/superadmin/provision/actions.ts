'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'

export type ProvisionResult =
  | { success: true; orgId: string; userId: string; reference: string }
  | { success: false; error: string }

export async function provisionOrganisation(
  _prev: ProvisionResult | null,
  formData: FormData
): Promise<ProvisionResult> {
  const orgName        = (formData.get('org_name') as string | null)?.trim()
  const serviceTypeKey = (formData.get('service_type') as string | null)?.trim()
  const adminEmail     = (formData.get('admin_email') as string | null)?.trim()
  const adminName      = (formData.get('admin_name') as string | null)?.trim()
  const adminPassword  = (formData.get('admin_password') as string | null)?.trim()
  const trialDays      = parseInt(formData.get('trial_days') as string ?? '90', 10)
  const isCharity      = formData.get('is_charity') === 'on'
  const isBeta         = formData.get('is_beta') === 'on'

  // Validate inputs
  if (!orgName || !serviceTypeKey || !adminEmail || !adminName || !adminPassword) {
    return { success: false, error: 'All fields are required.' }
  }
  if (adminPassword.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters.' }
  }

  const supabase = createAdminClient()

  try {
    // ── 1. Resolve service_type_id ──────────────────────────────────────
    const { data: serviceType, error: stError } = await supabase
      .from('service_types')
      .select('id')
      .eq('name', serviceTypeKey)
      .single()

    if (stError || !serviceType) {
      return { success: false, error: `Service type "${serviceTypeKey}" not found. Check it exists in the service_types table.` }
    }

    // ── 2. Create organisation ──────────────────────────────────────────
    const trialExpiresAt = new Date()
    trialExpiresAt.setDate(trialExpiresAt.getDate() + trialDays)

    const { data: org, error: orgError } = await supabase
      .from('organisations')
      .insert({
        name: orgName,
        service_type_id: serviceType.id,
        subscription_tier: 'trial',
        trial_expires_at: trialExpiresAt.toISOString(),
        is_demo: false,
        is_beta: isBeta,
      })
      .select('id')
      .single()

    if (orgError || !org) {
      return { success: false, error: 'Failed to create organisation: ' + (orgError?.message ?? 'unknown error') }
    }

    // ── 3. Create auth user ─────────────────────────────────────────────
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,      // skip email confirmation flow for invited beta users
      user_metadata: { full_name: adminName },
    })

    if (authError || !authData.user) {
      // Roll back: delete the org we just created
      await supabase.from('organisations').delete().eq('id', org.id)
      return { success: false, error: 'Failed to create auth user: ' + (authError?.message ?? 'unknown error') }
    }

    const authUserId = authData.user.id

    // ── 4. Create public.users row ──────────────────────────────────────
    // Generate a unique username from email prefix
    const emailPrefix = adminEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
    const username = `${emailPrefix}_${Math.random().toString(36).slice(2, 6)}`

    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authUserId,
        email: adminEmail,
        full_name: adminName,
        username,
        role: 'admin',
        organisation_id: org.id,
        onboarding_complete: false,   // triggers welcome screen on first login
        marketing_consent: null,
      })

    if (userError) {
      // Roll back
      await supabase.auth.admin.deleteUser(authUserId)
      await supabase.from('organisations').delete().eq('id', org.id)
      return { success: false, error: 'Failed to create user profile: ' + userError.message }
    }

    // ── 5. Seed 24 compliance_records (one per KLO) ─────────────────────
    const { data: klos, error: kloError } = await supabase
      .from('klo_items')
      .select('id')
      .order('title')

    if (kloError || !klos || klos.length === 0) {
      // Non-fatal — records can be created later, but log it
      console.error('Could not fetch KLO items for compliance record seeding:', kloError?.message)
    } else {
      const records = klos.map(klo => ({
        organisation_id: org.id,
        klo_item_id: klo.id,
        // status intentionally left as default (NULL → Grey in RAG logic)
      }))

      const { error: crError } = await supabase
        .from('compliance_records')
        .insert(records)

      if (crError) {
        console.error('Compliance record seeding failed:', crError.message)
        // Non-fatal — don't roll back, the org and user are usable
      }
    }

    // ── 6. Send beta welcome email ───────────────────────────────────────
    const platformUrl = process.env.NEXT_PUBLIC_BASE_URL
      ?? 'https://alwaysready-inspection-readiness-pl-three.vercel.app'

    const trialExpiryFormatted = trialExpiresAt.toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
    })

    await sendEmail({
      to: adminEmail,
      subject: 'Welcome to AlwaysReady — your login details',
      type: 'transactional',
      bodyHtml: `
        <p style="margin:0 0 16px">Hi ${adminName},</p>

        <p style="margin:0 0 16px">
          Welcome to the AlwaysReady Beta. Your account for
          <strong>${orgName}</strong> is ready — you can log in right now.
        </p>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0"
          style="background:#f5f5f0;border-radius:6px;padding:20px 24px;margin:0 0 24px;width:100%">
          <tr>
            <td style="font-size:14px;line-height:2">
              <strong>Login URL:</strong>
              <a href="${platformUrl}/login" style="color:#014D4E">${platformUrl}/login</a><br>
              <strong>Email:</strong> ${adminEmail}<br>
              <strong>Password:</strong> ${adminPassword}<br>
              <strong>Trial expires:</strong> ${trialExpiryFormatted}
            </td>
          </tr>
        </table>

        <p style="margin:0 0 16px">
          As the account admin, you can add your team, assign KLOEs, and start
          building your inspection readiness from day one. If you have any
          questions, just reply to this email or open a support ticket from
          within the platform.
        </p>

        <p style="margin:0 0 24px">
          <a href="${platformUrl}/login"
            style="display:inline-block;background:#ffd700;color:#014D4E;font-weight:700;
                   font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none">
            Log in to AlwaysReady →
          </a>
        </p>

        <p style="margin:0;color:#555">
          AJ Parker<br>
          <span style="color:#888;font-size:13px">AlwaysReady · hello@alwaysready.uk</span>
        </p>
      `,
    })

    // ── 7. Done ─────────────────────────────────────────────────────────
    const reference = `ORG-${org.id.slice(0, 8).toUpperCase()}`

    return {
      success: true,
      orgId: org.id,
      userId: authUserId,
      reference,
    }

  } catch (err) {
    return { success: false, error: 'Unexpected error: ' + String(err) }
  }
}
