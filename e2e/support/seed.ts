/**
 * Seeds (or re-seeds, clean-slate) a stable E2E test account in the
 * `alwaysready-preview` Supabase project — never production. Run once
 * before a Playwright session: `npm run test:e2e:seed`.
 *
 * Creates:
 *   - an organisation ('active' tier, so trial-expiry logic never interferes)
 *   - an admin user, with a TOTP factor enrolled and verified (real MFA,
 *     the same enrolment flow a real user goes through — just automated:
 *     enroll() -> compute a valid code from the returned secret with
 *     otplib -> challengeAndVerify())
 *
 * Writes the account's email/password and the TOTP secret to
 * e2e/.fixtures/test-account.json (git-ignored) for specs to read and log
 * in with, computing a fresh code at test time.
 *
 * Re-running this always wipes and recreates the fixture from scratch —
 * simpler and more robust than trying to detect/patch partial leftover
 * state from a previous run.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { loadEnvLocal } from './env.ts'
import { currentTotpCode } from './totp.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..', '..')

const TEST_ORG_NAME = '__E2E_TEST_ORG__'
const TEST_EMAIL    = 'e2e-admin@alwaysready.invalid'
const TEST_PASSWORD = 'E2E-test-fixture-pw-7f3a9c!'

export async function seed() {
  const env = loadEnvLocal()
  const url = env.SUPABASE_PREVIEW_URL
  const serviceRoleKey = env.SUPABASE_PREVIEW_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_PREVIEW_URL / SUPABASE_PREVIEW_SERVICE_ROLE_KEY missing from .env.local')
  }
  // Safety check, same guard used elsewhere this session — refuse to run
  // against anything that isn't clearly the preview project.
  if (!url.includes('ybvbkbpzciakicxlwghs')) {
    throw new Error('SAFETY ABORT: SUPABASE_PREVIEW_URL does not look like the preview project. Refusing to seed.')
  }

  const admin = createClient(url, serviceRoleKey)

  // ── Clean slate: remove any previous fixture ────────────────────────────
  const { data: existingOrg } = await admin
    .from('organisations')
    .select('id')
    .eq('name', TEST_ORG_NAME)
    .maybeSingle()

  if (existingOrg) {
    const { data: existingUsers } = await admin
      .from('users')
      .select('id')
      .eq('organisation_id', existingOrg.id)
    for (const u of existingUsers ?? []) {
      await admin.auth.admin.deleteUser(u.id) // cascades the public.users row
    }
    await admin.from('organisations').delete().eq('id', existingOrg.id)
  }

  // ── Create org ───────────────────────────────────────────────────────────
  const { data: svcType, error: svcTypeError } = await admin
    .from('service_types')
    .select('id')
    .limit(1)
    .single()
  if (svcTypeError || !svcType) throw new Error('No service_types row found — cannot construct test org: ' + svcTypeError?.message)

  const { data: org, error: orgError } = await admin
    .from('organisations')
    .insert({ name: TEST_ORG_NAME, service_type_id: svcType.id, subscription_tier: 'active' })
    .select('id')
    .single()
  if (orgError || !org) throw new Error('org insert failed: ' + orgError?.message)

  // ── Create auth user + profile ──────────────────────────────────────────
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  })
  if (authError || !authUser?.user) throw new Error('auth user create failed: ' + authError?.message)
  const userId = authUser.user.id

  const { error: profileError } = await admin.from('users').insert({
    id: userId,
    organisation_id: org.id,
    email: TEST_EMAIL,
    role: 'admin',
    full_name: 'E2E Test Admin',
    username: 'e2e_test_admin',
    onboarding_complete: true,
  })
  if (profileError) throw new Error('users row insert failed: ' + profileError.message)

  // ── Enrol + verify a real TOTP factor, exactly like a real user would ──
  const userClient = createClient(url, serviceRoleKey)
  const { error: signInError } = await userClient.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  })
  if (signInError) throw new Error('sign-in for MFA enrolment failed: ' + signInError.message)

  const { data: enrollData, error: enrollError } = await userClient.auth.mfa.enroll({ factorType: 'totp' })
  if (enrollError || !enrollData) throw new Error('MFA enroll failed: ' + enrollError?.message)

  const secret = enrollData.totp.secret
  const code = currentTotpCode(secret)

  const { error: verifyError } = await userClient.auth.mfa.challengeAndVerify({
    factorId: enrollData.id,
    code,
  })
  if (verifyError) throw new Error('MFA verify (enrolment) failed: ' + verifyError.message)

  await userClient.auth.signOut()

  // ── Write fixture ────────────────────────────────────────────────────────
  const fixtureDir = join(REPO_ROOT, 'e2e', '.fixtures')
  mkdirSync(fixtureDir, { recursive: true })
  writeFileSync(
    join(fixtureDir, 'test-account.json'),
    JSON.stringify({ orgId: org.id, userId, email: TEST_EMAIL, password: TEST_PASSWORD, totpSecret: secret }, null, 2)
  )

  return { orgId: org.id, userId, email: TEST_EMAIL }
}

// Allow running directly: `node e2e/support/seed.ts` (via tsx) or imported as globalSetup.
if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(r => { console.log('Seeded E2E test account:', r); process.exit(0) })
    .catch(err => { console.error('Seed failed:', err); process.exit(1) })
}
