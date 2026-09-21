import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CRON_JOBS, evaluateCronHealth } from '../cron-health'

const now = new Date('2026-09-21T12:00:00Z')
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000).toISOString()
const allFresh = () => Object.keys(CRON_JOBS).map(job => ({ job, last_success_at: hoursAgo(1) }))

describe('evaluateCronHealth', () => {
  it('is healthy when every job finished recently', () => {
    expect(evaluateCronHealth(allFresh(), now)).toEqual({ ok: true, problems: [] })
  })

  it('flags a daily job that has been quiet for more than 27 hours, and only that one', () => {
    const rows = allFresh().map(r => r.job === 'review-reminders' ? { ...r, last_success_at: hoursAgo(30) } : r)
    const r = evaluateCronHealth(rows, now)
    expect(r.ok).toBe(false)
    expect(r.problems).toEqual(['review-reminders: no success for 30h (limit 27h)'])
  })

  it('does not flag a daily job at 26 hours (Hobby may fire it anywhere in its hour)', () => {
    const rows = allFresh().map(r => r.job === 'trial-emails' ? { ...r, last_success_at: hoursAgo(26) } : r)
    expect(evaluateCronHealth(rows, now).ok).toBe(true)
  })

  it('gives a weekly job a week plus slack', () => {
    const rows = (h: number) => allFresh().map(r => r.job === 'governance-digest' ? { ...r, last_success_at: hoursAgo(h) } : r)
    expect(evaluateCronHealth(rows(6 * 24), now).ok).toBe(true)
    expect(evaluateCronHealth(rows(8 * 24), now).problems[0]).toContain('governance-digest')
  })

  it('flags a job with no heartbeat row at all', () => {
    const rows = allFresh().filter(r => r.job !== 'data-deletion')
    expect(evaluateCronHealth(rows, now).problems).toEqual(['data-deletion: no heartbeat recorded'])
  })
})

describe('CRON_JOBS', () => {
  it('covers exactly the jobs scheduled in vercel.json, so a new cron cannot go unmonitored', () => {
    const vercel = JSON.parse(readFileSync(join(process.cwd(), 'vercel.json'), 'utf8')) as { crons: { path: string }[] }
    const scheduled = vercel.crons.map(c => c.path.replace('/api/cron/', '')).sort()
    expect(Object.keys(CRON_JOBS).sort()).toEqual(scheduled)
  })
})
