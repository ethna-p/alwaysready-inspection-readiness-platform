/**
 * /api/health and the scheduled-job heartbeats behind it (lib/cron-health.ts).
 *
 * An external uptime monitor watches /api/health: 200 means the database answers and every scheduled
 * job has finished within its schedule; 503 means something needs attention. This proves it against the
 * real database: healthy when every heartbeat is fresh, 503 naming the job when one goes stale, and a
 * real cron run stamps its own heartbeat (while a rejected, unauthorised request does not).
 *
 * Heartbeats live in the preview project only (this suite never touches production) and are restored to
 * fresh at the end.
 */
import { test, expect } from '@playwright/test'
import { getAdminClient } from './support/admin'
import { CRON_SECRET } from './support/cron'
import { must } from './support/db'

const JOBS = [
  'review-reminders', 'trial-emails', 'onboarding-emails', 'waitlist-nurture',
  'governance-digest', 'data-deletion', 'notification-reconfirmation', 'storage-backup',
]

async function setHeartbeat(job: string, when: Date) {
  const admin = getAdminClient()
  must(await admin.from('cron_heartbeats').upsert({ job, last_success_at: when.toISOString() }, { onConflict: 'job' }), `health: set heartbeat ${job}`)
}
async function getHeartbeat(job: string): Promise<Date> {
  const admin = getAdminClient()
  const { data, error } = await admin.from('cron_heartbeats').select('last_success_at').eq('job', job).single()
  expect(error).toBeNull()
  return new Date(data!.last_success_at)
}
async function allFresh() {
  for (const job of JOBS) await setHeartbeat(job, new Date())
}

test('health: 200 when every job is fresh, 503 naming the job when one goes stale', async ({ request }) => {
  test.setTimeout(60_000)
  try {
    await allFresh()
    const ok = await request.get('/api/health')
    expect(ok.status()).toBe(200)
    expect(await ok.json()).toEqual({ status: 'ok' })
    expect(ok.headers()['cache-control']).toBe('no-store')

    // review-reminders is a daily job (limit 27h): 30 hours quiet is a problem.
    await setHeartbeat('review-reminders', new Date(Date.now() - 30 * 3_600_000))
    const bad = await request.get('/api/health')
    expect(bad.status()).toBe(503)
    const body = await bad.json()
    expect(body.status).toBe('degraded')
    expect(body.problems).toHaveLength(1)
    expect(body.problems[0]).toContain('review-reminders')
  } finally {
    await allFresh()
  }
})

test('health: a real cron run stamps its own heartbeat; an unauthorised call does not', async ({ request }) => {
  test.setTimeout(60_000)
  const twoDaysAgo = new Date(Date.now() - 48 * 3_600_000)
  try {
    await setHeartbeat('waitlist-nurture', twoDaysAgo)

    // Rejected: no heartbeat.
    expect((await request.get('/api/cron/waitlist-nurture')).status()).toBe(401)
    expect((await getHeartbeat('waitlist-nurture')).getTime()).toBe(twoDaysAgo.getTime())

    // Accepted and finished: heartbeat is now.
    const run = await request.get('/api/cron/waitlist-nurture', { headers: { Authorization: `Bearer ${CRON_SECRET}` } })
    expect(run.status()).toBe(200)
    expect(Date.now() - (await getHeartbeat('waitlist-nurture')).getTime()).toBeLessThan(60_000)
  } finally {
    await allFresh()
  }
})
