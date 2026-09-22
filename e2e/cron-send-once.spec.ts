/**
 * Send-once protection for scheduled emails that have no organisation to key on
 * (waitlist-nurture). They claim a slot in cron_claims before sending.
 *
 * This environment has no RESEND_API_KEY, so a send always comes back `no_api_key`. That is
 * still enough to prove the two behaviours that matter, against the real database:
 *   1. a slot that is already claimed means the job sends nothing and changes nothing
 *      (what a second, redelivered invocation looks like), and
 *   2. when a send does NOT go out, the claim is released again, so the next run can retry
 *      instead of the failure silently blocking that email forever.
 * The organisation-scoped jobs share the same helper, which has unit tests
 * (lib/__tests__/notification-log.test.ts).
 */
import { test, expect } from '@playwright/test'
import { getAdminClient } from './support/admin'
import { CRON_SECRET } from './support/cron'
import { tidy } from './support/db'

const auth = { Authorization: `Bearer ${CRON_SECRET}` }

test('waitlist-nurture: an already-claimed email is not resent; a failed send leaves the lead and claim untouched', async ({ request }) => {
  test.setTimeout(60_000)
  const admin = getAdminClient()

  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  const { data: lead, error: leadErr } = await admin.from('waitlist_leads').insert({
    first_name:           'SendOnce',
    email:                `e2e-nurture-${Date.now()}@example.invalid`,
    marketing_opt_in:     true,
    nurture_opt_in:       true,
    nurture_emails_sent:  1,
    nurture_last_sent_at: tenDaysAgo,
    source:               'e2e',
  }).select('id, email').single()
  expect(leadErr).toBeNull()
  const claimKey = `${lead!.id}:2`

  const leadState = async () => {
    const { data, error } = await admin.from('waitlist_leads').select('nurture_emails_sent, nurture_last_sent_at').eq('id', lead!.id).single()
    expect(error).toBeNull()
    return data!
  }
  const claimRow = async () => {
    const { data, error } = await admin.from('cron_claims').select('claim_key').eq('job', 'waitlist-nurture').eq('claim_key', claimKey)
    expect(error).toBeNull()
    return data ?? []
  }

  try {
    // 1. Already claimed (a second invocation): nothing is sent, the lead does not advance.
    const { error: claimErr } = await admin.from('cron_claims').insert({ job: 'waitlist-nurture', claim_key: claimKey })
    expect(claimErr).toBeNull()
    const second = await request.get('/api/cron/waitlist-nurture', { headers: auth })
    expect(second.status()).toBe(200)
    expect((await second.json()).errors).not.toContain(lead!.email)
    expect((await leadState()).nurture_emails_sent).toBe(1)
    expect(await claimRow()).toHaveLength(1)

    // 2. Not claimed: the send cannot go out (no API key), so the lead must NOT advance
    //    (it used to, silently) and the claim must be released for a retry.
    tidy(await admin.from('cron_claims').delete().eq('job', 'waitlist-nurture').eq('claim_key', claimKey), 'cron-send-once: delete cron_claims')
    const failed = await request.get('/api/cron/waitlist-nurture', { headers: auth })
    expect(failed.status()).toBe(200)
    expect((await failed.json()).errors).toContain(lead!.email)
    const state = await leadState()
    expect(state.nurture_emails_sent).toBe(1)
    expect(state.nurture_last_sent_at).not.toBeNull()
    expect(new Date(state.nurture_last_sent_at!).toISOString()).toBe(new Date(tenDaysAgo).toISOString())
    expect(await claimRow()).toHaveLength(0)
  } finally {
    tidy(await admin.from('waitlist_leads').delete().eq('id', lead!.id), 'cron-send-once: delete waitlist_leads')
    tidy(await admin.from('cron_claims').delete().eq('job', 'waitlist-nurture').eq('claim_key', claimKey), 'cron-send-once: delete cron_claims')
  }
})
