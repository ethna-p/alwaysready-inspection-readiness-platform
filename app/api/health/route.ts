/**
 * GET /api/health
 *
 * The one URL an external uptime monitor watches. 200 `{ status: 'ok' }` when the database answers and
 * every scheduled job has finished successfully within its schedule; 503 `{ status: 'degraded', problems }`
 * otherwise. So a single monitor alerts on "the site is down" (no answer), "the database is unreachable",
 * and "a scheduled job has stopped" (lib/cron-health.ts).
 *
 * Public on purpose (a monitor cannot log in) and it reveals only job names and ages, nothing about
 * customers. Rate limited, and never cached.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createRateLimiter, getClientIp } from '@/lib/rate-limit'
import { evaluateCronHealth } from '@/lib/cron-health'

const limiter = createRateLimiter({ name: 'health', windowMs: 10 * 60_000, max: 120 })

const NO_STORE = { 'Cache-Control': 'no-store' }

export async function GET(req: NextRequest) {
  if (!await limiter.check(getClientIp(req))) {
    return NextResponse.json({ status: 'rate_limited' }, { status: 429, headers: NO_STORE })
  }

  const problems: string[] = []

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase.from('cron_heartbeats').select('job, last_success_at')
    if (error || !data) {
      problems.push('database: could not read')
    } else {
      problems.push(...evaluateCronHealth(data, new Date()).problems)
    }
  } catch {
    problems.push('database: unreachable')
  }

  if (problems.length > 0) {
    return NextResponse.json({ status: 'degraded', problems }, { status: 503, headers: NO_STORE })
  }
  return NextResponse.json({ status: 'ok' }, { status: 200, headers: NO_STORE })
}
