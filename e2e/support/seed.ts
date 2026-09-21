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
import { Redis } from '@upstash/redis'
import { loadEnvLocal } from './env.ts'
import { currentTotpCode } from './totp.ts'
import { deleteStoragePrefix } from '../../lib/utils/storage-cleanup.ts'
import { must } from './db.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..', '..')

const TEST_ORG_NAME    = '__E2E_TEST_ORG__'
const TEST_EMAIL       = 'e2e-admin@alwaysready.invalid'
const TEST_PASSWORD    = 'E2E-test-fixture-pw-7f3a9c!'
const TEAMMATE_EMAIL   = 'e2e-teammate@alwaysready.invalid'
const TEAMMATE_PASSWORD = 'E2E-teammate-initial-pw-2b6e1!'
// Superadmin status is purely email-based (see lib/assert-superadmin.ts) —
// no organisation_id, no public.users row — so this fixture's email must be
// the exact SUPERADMIN_EMAIL value the dev server itself is started with
// (playwright.config.ts's webServer.env), not a fixed literal like the two
// above.
const SUPERADMIN_PASSWORD = 'E2E-superadmin-fixture-pw-9k4m2!'

// Every IP-keyed rate limiter in the app (lib/rate-limit.ts, createRateLimiter
// call sites) falls back to the literal identifier 'unknown' when neither
// x-forwarded-for nor x-real-ip is set -- which is every request this local
// dev server ever receives, since Playwright hits it directly with no
// reverse proxy in front. That means all of these share one Redis bucket,
// per limiter name, across every e2e run forever (Redis persists across dev
// server restarts) -- not just inbound-email's sender-keyed bucket. Names
// must match each route's own `name:` in its createRateLimiter() call.
const IP_KEYED_LIMITER_NAMES = [
  'trial-signup',
  'cqc-lookup',
  'inbound-blog-signup',
  'inbound-contact',
  'inbound-demo',
  'inbound-waitlist',
  'inbound-optout',
  'support-content',
  'health',
]

/**
 * Clears the Redis rate-limit buckets that accumulate across e2e runs (see
 * the "rate limiter" trap in CLAUDE.md). Mirrors this function's own
 * philosophy for the DB fixture: wipe and recreate rather than trying to
 * detect and patch partial state.
 *
 * UPSTASH_REDIS_REST_URL has no preview/production split (unlike
 * SUPABASE_PREVIEW_DB_URL / SUPABASE_PRODUCTION_DB_URL) -- it's one Redis
 * instance shared with production, so this only ever targets identifiers a
 * real customer could never produce: this fixture's own .invalid sender
 * address, and the literal 'unknown' IP bucket described above. Never a
 * blanket flush of the rate-limit namespace.
 */
async function clearStaleRateLimitKeys(env: Record<string, string>) {
  const url = env.UPSTASH_REDIS_REST_URL
  const token = env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return // Not configured -- the in-memory fallback limiter resets on its own.

  const redis = new Redis({ url, token })

  const patterns = [
    `ar:rl:inbound-email*${TEST_EMAIL}*`,
    ...IP_KEYED_LIMITER_NAMES.map(name => `ar:rl:${name}*unknown*`),
  ]

  for (const pattern of patterns) {
    let cursor: string | number = 0
    do {
      const [nextCursor, keys] = await redis.scan(cursor, { match: pattern, count: 100 })
      if (keys.length > 0) await redis.del(...keys)
      cursor = nextCursor
    } while (cursor !== '0' && cursor !== 0)
  }
}

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
  const SUPERADMIN_EMAIL = env.SUPERADMIN_EMAIL
  if (!SUPERADMIN_EMAIL) {
    throw new Error('SUPERADMIN_EMAIL missing from .env.local — needed to seed the superadmin fixture.')
  }

  const admin = createClient(url, serviceRoleKey)

  // ── Clean slate: stale rate-limit buckets from previous e2e runs ────────
  await clearStaleRateLimitKeys(env)

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

    // support_tickets.submitted_by is NOT NULL REFERENCES auth.users(id) with
    // no ON DELETE clause — same class of block as the auditTables below,
    // found once e2e/support-tickets.spec.ts started actually creating
    // tickets. Replies reference ticket_id, not organisation_id, so they
    // need their own lookup first. Mirrors app/superadmin/organisations/
    // actions.ts's own Step 2 (deleted before its Step 3 directTables loop,
    // for the same reason).
    const { data: existingTickets } = await admin
      .from('support_tickets')
      .select('id')
      .eq('organisation_id', existingOrg.id)
    const existingTicketIds = (existingTickets ?? []).map(t => t.id)
    if (existingTicketIds.length > 0) {
      must(await admin.from('support_ticket_replies').delete().in('ticket_id', existingTicketIds), 'seed: delete support_ticket_replies')
    }
    must(await admin.from('support_tickets').delete().eq('organisation_id', existingOrg.id), 'seed: delete support_tickets')

    // A user who has ever made a compliance update (exactly what every spec
    // in this suite does) has rows in these audit tables referencing them
    // via a NOT NULL FK with no ON DELETE clause — auth.admin.deleteUser
    // fails outright ("Database error deleting user") until those are
    // cleared first. Mirrors what the superadmin org-deletion flow
    // (app/superadmin/organisations/actions.ts) already does correctly.
    // Was missing i_statement_evidence and the hr_* tables — added once the
    // People's Voice and HR-record specs started actually writing to them
    // (i_statement_evidence.updated_by has no ON DELETE clause at all, so it
    // blocks deleteUser exactly like the others once a row references this
    // org's admin/teammate). Now matches the reference list in
    // app/superadmin/organisations/actions.ts exactly.
    const auditTables = [
      'klo_checklist_completions',
      'compliance_record_history',
      'review_frequency_history',
      'priority_history',
      'compliance_records',
      'kloe_evidence',
      'i_statement_evidence',
      'hr_training_certificates',
      'hr_training_records',
      'hr_holiday_allowances',
      'hr_staff_profiles',
      'hr_training_types',
      'notification_log',
    ]
    for (const table of auditTables) {
      const { error: auditDeleteError } = await admin.from(table).delete().eq('organisation_id', existingOrg.id)
      // Errors here were previously swallowed silently -- the only symptom
      // was deleteUser failing several steps later with a generic "Database
      // error deleting user", giving no hint which table's leftover row was
      // actually the cause. Surface it here instead, at the source.
      if (auditDeleteError) {
        throw new Error(`Failed to clear ${table} for stale fixture org ${existingOrg.id}: ${auditDeleteError.message}`)
      }
    }

    for (const u of existingUsers ?? []) {
      const { error: deleteUserError } = await admin.auth.admin.deleteUser(u.id)
      if (deleteUserError) {
        throw new Error(`Failed to delete stale fixture user ${u.email}: ${deleteUserError.message}`)
      }
    }
    // deleteUser cascades the public.users row for a real FK-driven delete,
    // but belt-and-braces in case that row somehow outlived it.
    must(await admin.from('users').delete().eq('organisation_id', existingOrg.id), 'seed: delete users')

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

  // Belt-and-braces, independent of the org-based cleanup above: that whole
  // path only ever finds a stale user via organisation_id on their
  // public.users row — if that row is EVER missing while the auth.users row
  // survives (seen for real: a prior run's cascade deleted both fixture
  // users' public.users rows, via ON DELETE CASCADE from an org row it
  // successfully removed, but something orphaned the auth.users rows before
  // that same pass reached them), the org-based query finds nothing to
  // delete and those emails are stuck forever — every future createUser()
  // for them fails with "already been registered", with no path back to a
  // clean slate short of finding them by email directly, like this.
  const { data: allAuthUsers } = await admin.auth.admin.listUsers()
  for (const email of [TEST_EMAIL, TEAMMATE_EMAIL, SUPERADMIN_EMAIL]) {
    const orphan = allAuthUsers?.users.find(u => u.email === email)
    if (orphan) {
      const { error } = await admin.auth.admin.deleteUser(orphan.id)
      if (error) throw new Error(`Failed to delete orphaned fixture auth user ${email}: ${error.message}`)
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
  // actions (e.g. resetTeamMemberMfa) without needing MFA of its own.
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

  // ── Create the superadmin fixture (auth user only — no org, no public.users
  // row, matching the real superadmin's own design) with real MFA enrolled ──
  const { data: superadminAuthUser, error: superadminAuthError } = await admin.auth.admin.createUser({
    email: SUPERADMIN_EMAIL,
    password: SUPERADMIN_PASSWORD,
    email_confirm: true,
  })
  if (superadminAuthError || !superadminAuthUser?.user) {
    throw new Error('superadmin auth user create failed: ' + superadminAuthError?.message)
  }
  const superadminUserId = superadminAuthUser.user.id

  const superadminClient = createClient(url, serviceRoleKey)
  const { error: superadminSignInError } = await superadminClient.auth.signInWithPassword({
    email: SUPERADMIN_EMAIL,
    password: SUPERADMIN_PASSWORD,
  })
  if (superadminSignInError) throw new Error('sign-in for superadmin MFA enrolment failed: ' + superadminSignInError.message)

  const { data: superadminEnrollData, error: superadminEnrollError } = await superadminClient.auth.mfa.enroll({ factorType: 'totp' })
  if (superadminEnrollError || !superadminEnrollData) throw new Error('superadmin MFA enroll failed: ' + superadminEnrollError?.message)

  const superadminSecret = superadminEnrollData.totp.secret
  const superadminCode = currentTotpCode(superadminSecret)

  const { error: superadminVerifyError } = await superadminClient.auth.mfa.challengeAndVerify({
    factorId: superadminEnrollData.id,
    code: superadminCode,
  })
  if (superadminVerifyError) throw new Error('superadmin MFA verify (enrolment) failed: ' + superadminVerifyError.message)

  await superadminClient.auth.signOut()

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
      superadmin: {
        userId: superadminUserId,
        email: SUPERADMIN_EMAIL,
        password: SUPERADMIN_PASSWORD,
        totpSecret: superadminSecret,
      },
    }, null, 2)
  )

  return { orgId: org.id, userId, email: TEST_EMAIL, teammateUserId, teammateEmail: TEAMMATE_EMAIL, superadminUserId }
}

// Allow running directly: `node e2e/support/seed.ts` (via tsx) or imported as globalSetup.
if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(r => { console.log('Seeded E2E test account:', r); process.exit(0) })
    .catch(err => { console.error('Seed failed:', err); process.exit(1) })
}
