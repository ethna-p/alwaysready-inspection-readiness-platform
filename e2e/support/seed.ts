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
import { deleteStoragePrefix } from '../../lib/utils/storage-cleanup.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..', '..')

const TEST_ORG_NAME    = '__E2E_TEST_ORG__'
const TEST_EMAIL       = 'e2e-admin@alwaysready.invalid'
const TEST_PASSWORD    = 'E2E-test-fixture-pw-7f3a9c!'
const TEAMMATE_EMAIL   = 'e2e-teammate@alwaysready.invalid'
const TEAMMATE_PASSWORD = 'E2E-teammate-initial-pw-2b6e1!'

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

  // ── Clean slate: remove any previous fixture(s) ─────────────────────────
  // Plural deliberately: .maybeSingle() here used to throw PGRST116 on more
  // than one matching row and — since only `data` was destructured, never
  // `error` — that failure was silent, so the whole cleanup block was
  // skipped and a duplicate org+user was left behind. That's not a
  // hypothetical: it's exactly what happened on 2026-09-12, compounded by
  // the second bug below, and the fixed version needs to cope with an
  // arbitrary number of stale orgs already sitting there from it, not just
  // assume at most one.
  const { data: existingOrgs, error: existingOrgsError } = await admin
    .from('organisations')
    .select('id')
    .eq('name', TEST_ORG_NAME)
  if (existingOrgsError) {
    throw new Error('Failed to look up existing fixture org(s): ' + existingOrgsError.message)
  }

  for (const existingOrg of existingOrgs ?? []) {
    const { data: existingUsers } = await admin
      .from('users')
      .select('id, email')
      .eq('organisation_id', existingOrg.id)

    // A user who has ever made a compliance update (exactly what every spec
    // in this suite does) has rows in these audit tables referencing them
    // via a NOT NULL FK with no ON DELETE clause — auth.admin.deleteUser
    // fails outright ("Database error deleting user") until those are
    // cleared first. Mirrors what the superadmin org-deletion flow
    // (app/superadmin/organisations/actions.ts) already does correctly.
    const auditTables = [
      'klo_checklist_completions',
      'compliance_record_history',
      'review_frequency_history',
      'priority_history',
      'compliance_records',
      'kloe_evidence',
      'notification_log',
    ]
    for (const table of auditTables) {
      await admin.from(table).delete().eq('organisation_id', existingOrg.id)
    }

    for (const u of existingUsers ?? []) {
      const { error: deleteUserError } = await admin.auth.admin.deleteUser(u.id)
      if (deleteUserError) {
        throw new Error(`Failed to delete stale fixture user ${u.email}: ${deleteUserError.message}`)
      }
    }
    // deleteUser cascades the public.users row for a real FK-driven delete,
    // but belt-and-braces in case that row somehow outlived it.
    await admin.from('users').delete().eq('organisation_id', existingOrg.id)

    // A spec that actually uploaded evidence (kloe-evidence-upload.spec.ts)
    // left real files in Storage — the row deletes above never touch those.
    // Mirrors the same real-app fix this session made to
    // app/superadmin/organisations/actions.ts for exactly this reason.
    await deleteStoragePrefix(admin, 'evidence', existingOrg.id)

    const { error: deleteOrgError } = await admin.from('organisations').delete().eq('id', existingOrg.id)
    if (deleteOrgError) {
      throw new Error(`Failed to delete stale fixture org ${existingOrg.id}: ${deleteOrgError.message}`)
    }
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

  // ── Create a second, teammate account (role 'user', no MFA enrolled) ───
  // Gives the admin fixture a real in-org target for team-management
  // actions (e.g. resetTeamMemberPassword) without needing MFA of its own.
  const { data: teammateAuthUser, error: teammateAuthError } = await admin.auth.admin.createUser({
    email: TEAMMATE_EMAIL,
    password: TEAMMATE_PASSWORD,
    email_confirm: true,
  })
  if (teammateAuthError || !teammateAuthUser?.user) {
    throw new Error('teammate auth user create failed: ' + teammateAuthError?.message)
  }
  const teammateUserId = teammateAuthUser.user.id

  const { error: teammateProfileError } = await admin.from('users').insert({
    id: teammateUserId,
    organisation_id: org.id,
    email: TEAMMATE_EMAIL,
    role: 'user',
    full_name: 'E2E Test Teammate',
    username: 'e2e_test_teammate',
    onboarding_complete: true,
  })
  if (teammateProfileError) throw new Error('teammate users row insert failed: ' + teammateProfileError.message)

  // ── Write fixture ────────────────────────────────────────────────────────
  const fixtureDir = join(REPO_ROOT, 'e2e', '.fixtures')
  mkdirSync(fixtureDir, { recursive: true })
  writeFileSync(
    join(fixtureDir, 'test-account.json'),
    JSON.stringify({
      orgId: org.id,
      userId,
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      totpSecret: secret,
      teammate: {
        userId: teammateUserId,
        email: TEAMMATE_EMAIL,
        password: TEAMMATE_PASSWORD,
        fullName: 'E2E Test Teammate',
      },
    }, null, 2)
  )

  return { orgId: org.id, userId, email: TEST_EMAIL, teammateUserId, teammateEmail: TEAMMATE_EMAIL }
}

// Allow running directly: `node e2e/support/seed.ts` (via tsx) or imported as globalSetup.
if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(r => { console.log('Seeded E2E test account:', r); process.exit(0) })
    .catch(err => { console.error('Seed failed:', err); process.exit(1) })
}
