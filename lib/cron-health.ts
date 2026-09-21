/**
 * Health of the scheduled jobs, so a job that silently stops is noticed.
 *
 * Every job in vercel.json stamps cron_heartbeats when it finishes successfully (withHeartbeat below).
 * /api/health compares each stamp with how often that job should run. An external uptime monitor watching
 * /api/health then alerts on the 503, covering "site down" and "a job stopped" with one check.
 *
 * Vercel's Hobby plan may fire a job anywhere within its scheduled hour, so a daily job is only called
 * stale after 27 hours (24 + the hour of slack + margin) and a weekly one after 7 days 3 hours.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { reportDbError } from '@/lib/db-errors'

const DAILY_HOURS  = 27
const WEEKLY_HOURS = 7 * 24 + 3

/** Every scheduled job and the longest it may go without finishing. Must match vercel.json (a unit test checks). */
export const CRON_JOBS: Record<string, number> = {
  'review-reminders':            DAILY_HOURS,
  'trial-emails':                DAILY_HOURS,
  'onboarding-emails':           DAILY_HOURS,
  'waitlist-nurture':            DAILY_HOURS,
  'governance-digest':           WEEKLY_HOURS,
  'data-deletion':               DAILY_HOURS,
  'notification-reconfirmation': WEEKLY_HOURS,
  'demo-reminder':               DAILY_HOURS,
}

export interface HeartbeatRow { job: string; last_success_at: string }

export interface CronHealth {
  ok: boolean
  /** Human-readable reasons, e.g. "review-reminders: no success for 30h (limit 27h)". */
  problems: string[]
}

/** Pure: which jobs are overdue at `now`, given the stored heartbeats. */
export function evaluateCronHealth(rows: HeartbeatRow[], now: Date): CronHealth {
  const byJob = new Map(rows.map(r => [r.job, new Date(r.last_success_at)]))
  const problems: string[] = []
  for (const [job, limitHours] of Object.entries(CRON_JOBS)) {
    const last = byJob.get(job)
    if (!last) {
      problems.push(`${job}: no heartbeat recorded`)
      continue
    }
    const ageHours = (now.getTime() - last.getTime()) / 3_600_000
    if (ageHours > limitHours) problems.push(`${job}: no success for ${Math.floor(ageHours)}h (limit ${limitHours}h)`)
  }
  return { ok: problems.length === 0, problems }
}

/** Records that a job finished successfully just now. A failure here is reported, never thrown. */
export async function recordHeartbeat(supabase: SupabaseClient, job: string): Promise<void> {
  const { error } = await supabase
    .from('cron_heartbeats')
    .upsert({ job, last_success_at: new Date().toISOString() }, { onConflict: 'job' })
  reportDbError(error, `cron-health: record heartbeat for ${job}`)
}

/**
 * Wraps a cron route handler: when it answers with a success status, the job's heartbeat is recorded.
 * Requests rejected with 401, and runs that fail with 4xx/5xx, leave the heartbeat alone.
 */
export function withHeartbeat<A extends unknown[]>(
  job: string,
  handler: (...args: A) => Promise<Response>,
  getClient: () => SupabaseClient,
): (...args: A) => Promise<Response> {
  return async (...args: A) => {
    const response = await handler(...args)
    if (response.status >= 200 && response.status < 300) await recordHeartbeat(getClient(), job)
    return response
  }
}
