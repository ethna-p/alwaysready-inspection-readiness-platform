/**
 * cron_claims: the send-once ledger for scheduled jobs that have no organisation
 * (demo-reminder, waitlist-nurture). Pins the three properties those jobs rely on:
 * a second claim of the same (job, key) is refused with a unique violation, different
 * keys and jobs do not collide, and only the service role can touch the table.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Client } from 'pg'
import { connectSuperuser } from './helpers'

let client: Client
const job = 'cron-claims-test'

beforeAll(async () => {
  client = await connectSuperuser()
  await client.query(`DELETE FROM public.cron_claims WHERE job LIKE 'cron-claims-test%'`)
})

afterAll(async () => {
  await client.query(`DELETE FROM public.cron_claims WHERE job LIKE 'cron-claims-test%'`)
  await client.end()
})

describe('claiming', () => {
  it('refuses a second claim of the same job and key', async () => {
    await client.query(`INSERT INTO public.cron_claims (job, claim_key) VALUES ($1, 'k1')`, [job])
    await expect(
      client.query(`INSERT INTO public.cron_claims (job, claim_key) VALUES ($1, 'k1')`, [job])
    ).rejects.toMatchObject({ code: '23505' })
  })

  it('allows a different key, and the same key under a different job', async () => {
    await client.query(`INSERT INTO public.cron_claims (job, claim_key) VALUES ($1, 'k2')`, [job])
    await client.query(`INSERT INTO public.cron_claims (job, claim_key) VALUES ($1, 'k1')`, [job + '-other'])
  })

  it('can be claimed again after the claim is released', async () => {
    await client.query(`DELETE FROM public.cron_claims WHERE job = $1 AND claim_key = 'k1'`, [job])
    await client.query(`INSERT INTO public.cron_claims (job, claim_key) VALUES ($1, 'k1')`, [job])
  })
})

describe('access', () => {
  it('has row level security enabled', async () => {
    const { rows } = await client.query(`SELECT relrowsecurity FROM pg_class WHERE oid = 'public.cron_claims'::regclass`)
    expect(rows[0].relrowsecurity).toBe(true)
  })

  it('gives anon and authenticated no privileges at all', async () => {
    const { rows } = await client.query(
      `SELECT has_table_privilege('anon', 'public.cron_claims', 'SELECT,INSERT,UPDATE,DELETE') AS anon,
              has_table_privilege('authenticated', 'public.cron_claims', 'SELECT,INSERT,UPDATE,DELETE') AS authenticated,
              has_table_privilege('service_role', 'public.cron_claims', 'SELECT,INSERT,DELETE') AS service_role`
    )
    expect(rows[0]).toEqual({ anon: false, authenticated: false, service_role: true })
  })
})
