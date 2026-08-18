'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { assertSuperadmin } from '@/lib/assert-superadmin'

export type DemoOrgResult = {
  serviceType: string
  orgName: string
  email: string
  password: string
  orgId: string | null
  success: boolean
  error: string | null
}

const DEMO_ORGS: Array<{ serviceType: string; orgName: string; emailSlug: string }> = [
  { serviceType: 'ARBD Specialist Care Home',          orgName: 'Demo — ARBD Specialist Care Home',   emailSlug: 'arbd' },
  { serviceType: 'Community Drug and Alcohol Service', orgName: 'Demo — Community Drug & Alcohol',    emailSlug: 'drug-alcohol' },
  { serviceType: 'Dual-Registered Care Home',          orgName: 'Demo — Dual-Registered Care Home',   emailSlug: 'dual-registered' },
  { serviceType: 'Extra Care Housing',                 orgName: 'Demo — Extra Care Housing',          emailSlug: 'extra-care' },
  { serviceType: 'Homecare Agency',                    orgName: 'Demo — Homecare Agency',             emailSlug: 'homecare' },
  { serviceType: 'Nursing Home',                       orgName: 'Demo — Nursing Home',                emailSlug: 'nursing-home' },
  { serviceType: 'Residential Care Home',              orgName: 'Demo — Residential Care Home',       emailSlug: 'residential' },
  { serviceType: 'Residential Rehabilitation Service', orgName: 'Demo — Residential Rehab Service',   emailSlug: 'rehab' },
  { serviceType: 'Shared Lives Scheme',                orgName: 'Demo — Shared Lives Scheme',         emailSlug: 'shared-lives' },
  { serviceType: 'Specialist College',                 orgName: 'Demo — Specialist College',          emailSlug: 'specialist-college' },
  { serviceType: 'Supported Living',                   orgName: 'Demo — Supported Living',            emailSlug: 'supported-living' },
]

/** Generates a 16-character password (no ambiguous chars: 0/O, 1/l/I). */
function generatePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => chars[b % chars.length]).join('')
}

export async function provisionDemoOrgs(): Promise<DemoOrgResult[]> {
  await assertSuperadmin()
  const supabase = createAdminClient()

  const results: DemoOrgResult[] = []

  for (const demo of DEMO_ORGS) {
    const email     = `demo.${demo.emailSlug}@alwaysready.uk`
    const password  = generatePassword()
    const adminName = 'Demo Admin'

    try {
      // ── 1. Resolve service type ─────────────────────────────────────────
      const { data: st, error: stErr } = await supabase
        .from('service_types')
        .select('id')
        .eq('name', demo.serviceType)
        .single()

      if (stErr || !st) {
        results.push({ ...demo, email, password, orgId: null, success: false,
          error: `Service type not found: ${demo.serviceType}` })
        continue
      }

      // ── 2. Create org (active, no trial expiry) ────────────────────────
      const { data: org, error: orgErr } = await supabase
        .from('organisations')
        .insert({
          name: demo.orgName,
          service_type_id: st.id,
          subscription_tier: 'active',
          trial_expires_at: null,
          is_beta: true,
        })
        .select('id')
        .single()

      if (orgErr || !org) {
        results.push({ ...demo, email, password, orgId: null, success: false,
          error: orgErr?.message ?? 'Org insert failed' })
        continue
      }

      // ── 3. Create auth user ─────────────────────────────────────────────
      const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: adminName },
      })

      if (authErr || !authData.user) {
        await supabase.from('organisations').delete().eq('id', org.id)
        results.push({ ...demo, email, password, orgId: null, success: false,
          error: authErr?.message ?? 'Auth user creation failed' })
        continue
      }

      const authUserId = authData.user.id

      // ── 4. Create public.users row ──────────────────────────────────────
      const { error: userErr } = await supabase
        .from('users')
        .insert({
          id: authUserId,
          email,
          full_name: adminName,
          role: 'admin',
          organisation_id: org.id,
          onboarding_complete: false,
          marketing_consent: null,
        })

      if (userErr) {
        await supabase.auth.admin.deleteUser(authUserId)
        await supabase.from('organisations').delete().eq('id', org.id)
        results.push({ ...demo, email, password, orgId: null, success: false,
          error: userErr.message })
        continue
      }

      // ── 5. Seed compliance records ──────────────────────────────────────
      const { data: klos } = await supabase
        .from('klo_items')
        .select('id')
        .order('title')

      if (klos && klos.length > 0) {
        await supabase.from('compliance_records').insert(
          klos.map(klo => ({ organisation_id: org.id, klo_item_id: klo.id }))
        ).then(({ error: crErr }) => {
          if (crErr) console.error('[demo-provision] compliance_records seed failed:', crErr.message)
        })
      }

      results.push({ ...demo, email, password, orgId: org.id, success: true, error: null })

    } catch (err) {
      results.push({ ...demo, email, password, orgId: null, success: false, error: String(err) })
    }
  }

  // ── One summary email to superadmin ────────────────────────────────────
  const rows = results.map(r =>
    `<tr>
      <td style="padding:6px 12px;border-bottom:1px solid #e5e5e5">${r.success ? '✓' : '✗'}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #e5e5e5">${r.serviceType}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #e5e5e5;font-family:monospace;font-size:12px">${r.email}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #e5e5e5;font-family:monospace;font-size:12px">${r.success ? r.password : r.error ?? ''}</td>
    </tr>`
  ).join('')

  await sendEmail({
    to: process.env.SUPERADMIN_EMAIL ?? 'support@alwaysready.uk',
    subject: '[AlwaysReady] Demo orgs provisioned — credentials',
    type: 'transactional',
    bodyHtml: `
      <p style="margin:0 0 16px">
        ${results.filter(r => r.success).length} of 11 demo organisations were provisioned successfully.
        Save these credentials — the passwords are not stored elsewhere.
      </p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0"
        style="width:100%;border-collapse:collapse;font-size:13px">
        <thead>
          <tr style="background:#f5f5f0;text-align:left">
            <th style="padding:8px 12px">OK</th>
            <th style="padding:8px 12px">Service type</th>
            <th style="padding:8px 12px">Email</th>
            <th style="padding:8px 12px">Password</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `,
  }).catch(err => console.error('[demo-provision] summary email failed:', err))

  return results
}
