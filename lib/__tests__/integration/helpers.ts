/**
 * Shared helpers for integration tests.
 *
 * Tests connect directly to the local Supabase Postgres instance (port 54322)
 * as the postgres superuser so they can:
 *   1. Seed auth.users and public.users without going through the auth API
 *   2. Switch role to 'authenticated' with forged JWT claims to test RLS
 *   3. Roll back after each test to keep the DB clean
 *
 * The INTEGRATION_DB_URL env var is set by the CI workflow.
 * Locally: run `supabase start` first, then `npm run test:integration`.
 */

import { Client } from 'pg'
import { randomUUID } from 'crypto'

export const DB_URL =
  process.env.INTEGRATION_DB_URL ??
  'postgresql://postgres:postgres@localhost:54322/postgres'

/** Return a connected superuser client. Caller must call client.end(). */
export async function connectSuperuser(): Promise<Client> {
  const client = new Client({ connectionString: DB_URL })
  await client.connect()
  return client
}

/** Seed a minimal auth.users row and matching public.users row. Returns both IDs. */
export async function seedUser(
  client: Client,
  opts: {
    organisationId: string
    role?: 'admin' | 'user' | 'viewer'
    email?: string
  }
): Promise<{ authUserId: string; email: string }> {
  const authUserId = randomUUID()
  const email = opts.email ?? `test-${authUserId}@example.com`
  const role = opts.role ?? 'user'

  // Insert into auth.users (Supabase auth schema)
  await client.query(
    `INSERT INTO auth.users (
       id, instance_id, aud, role, email,
       encrypted_password, email_confirmed_at,
       created_at, updated_at, raw_app_meta_data, raw_user_meta_data
     ) VALUES (
       $1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       $2, 'placeholder', now(), now(), now(), '{}', '{}'
     )`,
    [authUserId, email]
  )

  // Insert into public.users.
  // Viewers require a future viewer_expires_at to pass the H3 RLS policy.
  const viewerExpiry = role === 'viewer'
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
    : null

  await client.query(
    `INSERT INTO public.users (id, organisation_id, email, role, full_name, username, viewer_expires_at)
     VALUES ($1, $2, $3, $4, 'Test User', $5, $6)`,
    [authUserId, opts.organisationId, email, role, `testuser-${authUserId.slice(0, 8)}`, viewerExpiry]
  )

  return { authUserId, email }
}

/** Seed a minimal organisation. Returns its id. */
export async function seedOrg(
  client: Client,
  opts: { name?: string } = {}
): Promise<string> {
  const orgId = randomUUID()
  const name = opts.name ?? `Test Org ${orgId.slice(0, 8)}`

  // service_type_id is NOT NULL — look up any seeded value from the reference table
  const { rows } = await client.query<{ id: string }>(
    `SELECT id FROM public.service_types LIMIT 1`
  )
  const serviceTypeId = rows[0]?.id
  if (!serviceTypeId) throw new Error('No service_types rows found — migrations may not have run')

  await client.query(
    `INSERT INTO public.organisations (id, name, subscription_tier, service_type_id)
     VALUES ($1, $2, 'trial', $3)`,
    [orgId, name, serviceTypeId]
  )
  return orgId
}

/**
 * Run a callback as an authenticated Postgres user with RLS active.
 *
 * Wraps in a transaction that is always rolled back — queries inside
 * the callback can read/write but the changes are never committed.
 * The superuser client temporarily sets role=authenticated and injects
 * JWT claims so that auth.uid() and get_user_org_id() work correctly.
 */
export async function withAuthUser<T>(
  client: Client,
  authUserId: string,
  fn: (client: Client) => Promise<T>
): Promise<T> {
  await client.query('BEGIN')
  // Inject JWT claims — this is how Supabase's auth.uid() reads the current user
  await client.query(`SELECT set_config('request.jwt.claims', $1, true)`, [
    JSON.stringify({ sub: authUserId, role: 'authenticated', iss: 'supabase-demo' }),
  ])
  // Activate RLS by switching to the authenticated role
  await client.query('SET LOCAL ROLE authenticated')
  try {
    const result = await fn(client)
    return result
  } finally {
    // Always rollback — tests must not leave data behind
    await client.query('ROLLBACK')
  }
}

/** Clean up seeded rows by id. Call in afterAll. */
export async function cleanupOrg(client: Client, orgId: string): Promise<void> {
  // Delete all compliance child tables before users — changed_by / last_updated_by
  // reference auth.users(id) with no ON DELETE CASCADE.
  await client.query(`DELETE FROM public.priority_history WHERE organisation_id = $1`, [orgId])
  await client.query(`DELETE FROM public.review_frequency_history WHERE organisation_id = $1`, [orgId])
  await client.query(`DELETE FROM public.compliance_record_history WHERE organisation_id = $1`, [orgId])
  await client.query(`DELETE FROM public.compliance_records WHERE organisation_id = $1`, [orgId])
  // Delete auth.users first (FK: public.users.id → auth.users.id may cascade,
  // but we also delete public.users explicitly before the organisation).
  await client.query(
    `DELETE FROM auth.users WHERE id IN (
       SELECT id FROM public.users WHERE organisation_id = $1
     )`,
    [orgId]
  )
  // Delete public.users before the organisation — users_organisation_id_fkey is NOT cascade.
  await client.query(`DELETE FROM public.users WHERE organisation_id = $1`, [orgId])
  // Now safe to delete the organisation.
  await client.query(`DELETE FROM public.organisations WHERE id = $1`, [orgId])
}
