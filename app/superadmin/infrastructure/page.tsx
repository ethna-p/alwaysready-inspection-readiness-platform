/**
 * /superadmin/infrastructure — free-tier usage monitor.
 *
 * Live data:
 *   - Resend email counts (from notification_log)
 *   - Supabase active user count (MAU proxy)
 *   - Upstash daily commands + storage (Management API)
 *   - Sentry errors this month (Stats v2 API)
 *   - Vercel bandwidth + build minutes (REST API)
 *   - Cloudflare Workers requests today (GraphQL Analytics API)
 *
 * Each external API falls back to a static reference card when the
 * required env vars are absent or the fetch fails. Anthropic has no
 * public usage API so its card is always static.
 *
 * Required env vars (add to Vercel dashboard + .env):
 *   UPSTASH_MANAGEMENT_EMAIL      — your Upstash account email
 *   UPSTASH_MANAGEMENT_API_KEY    — Upstash console > Management API
 *   UPSTASH_REDIS_DATABASE_ID     — Upstash console > your database > ID
 *   SENTRY_AUTH_TOKEN             — Sentry > Settings > Auth Tokens
 *   SENTRY_ORG_SLUG               — your Sentry organisation slug
 *   VERCEL_API_TOKEN              — Vercel > Settings > Tokens
 *   VERCEL_TEAM_ID                — Vercel team ID (omit for personal accounts)
 *   CLOUDFLARE_API_TOKEN          — Cloudflare > My Profile > API Tokens
 *   CLOUDFLARE_ACCOUNT_ID         — Cloudflare dashboard Overview sidebar
 *   CLOUDFLARE_WORKER_NAME        — script name of the chat worker (e.g. "chat")
 */

import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// ── helpers ───────────────────────────────────────────────────────────────────

function pct(used: number, limit: number) {
  return Math.min(100, Math.round((used / limit) * 100))
}

function barColour(p: number) {
  if (p >= 90) return 'bg-red-500'
  if (p >= 70) return 'bg-amber-400'
  return 'bg-emerald-500'
}

function statusBadge(p: number) {
  if (p >= 90) return <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Near limit</span>
  if (p >= 70) return <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Watch this</span>
  return <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Fine</span>
}

function Meter({ used, limit, unit }: { used: number; limit: number; unit: string }) {
  const p = pct(used, limit)
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-ink font-medium">{used.toLocaleString()} / {limit.toLocaleString()} {unit}</span>
        <span className="text-ink-muted">{p}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-fill-dim overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColour(p)}`} style={{ width: `${p}%` }} />
      </div>
    </div>
  )
}

function NotConfigured() {
  return (
    <span className="text-xs font-medium text-ink-muted bg-fill px-2 py-0.5 rounded-full">
      API key not configured
    </span>
  )
}

// ── external API fetch functions ──────────────────────────────────────────────

type UpstashStats = { dailyCommands: number; storageMB: number }

async function fetchUpstashStats(): Promise<UpstashStats | null> {
  const email = process.env.UPSTASH_MANAGEMENT_EMAIL
  const apiKey = process.env.UPSTASH_MANAGEMENT_API_KEY
  const dbId   = process.env.UPSTASH_REDIS_DATABASE_ID
  if (!email || !apiKey || !dbId) {
    console.error('[Upstash] missing env vars', { email: !!email, apiKey: !!apiKey, dbId: !!dbId })
    return null
  }
  try {
    const auth = Buffer.from(`${email}:${apiKey}`).toString('base64')
    console.log('[Upstash] dbId prefix:', dbId.slice(0, 8), 'email prefix:', email.slice(0, 6))
    const res  = await fetch(`https://api.upstash.com/v2/redis/database/${dbId}`, {
      headers: { Authorization: `Basic ${auth}` },
      cache: 'no-store',
    })
    if (!res.ok) {
      const body = await res.text()
      console.error('[Upstash] API error', res.status, body)
      return null
    }
    const data = await res.json() as Record<string, unknown>
    return {
      dailyCommands: typeof data.daily_request_count === 'number' ? data.daily_request_count : 0,
      storageMB:     typeof data.storage_size === 'number'
        ? Math.round((data.storage_size as number) / (1024 * 1024))
        : 0,
    }
  } catch { return null }
}

type SentryStats = { errorsThisMonth: number }

async function fetchSentryStats(): Promise<SentryStats | null> {
  const token   = process.env.SENTRY_AUTH_TOKEN
  const orgSlug = process.env.SENTRY_ORG_SLUG
  if (!token || !orgSlug) return null
  try {
    const url = [
      `https://sentry.io/api/0/organizations/${orgSlug}/stats_v2/`,
      '?field=sum(quantity)',
      '&category=error',
      '&outcome=accepted',
      '&interval=1d',
      '&statsPeriod=30d',
    ].join('')
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json() as {
      groups?: Array<{ totals?: { 'sum(quantity)': number } }>
    }
    const total = (data.groups ?? []).reduce(
      (acc, g) => acc + (g.totals?.['sum(quantity)'] ?? 0), 0
    )
    return { errorsThisMonth: total }
  } catch { return null }
}

type VercelUsage = { bandwidthGB: number; buildMinutes: number }

async function fetchVercelUsage(): Promise<VercelUsage | null> {
  const token  = process.env.VERCEL_API_TOKEN
  const teamId = process.env.VERCEL_TEAM_ID
  if (!token) {
    console.error('[Vercel] missing VERCEL_API_TOKEN')
    return null
  }
  try {
    const qs  = teamId ? `?teamId=${teamId}` : ''
    const res = await fetch(`https://api.vercel.com/v2/usage${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) {
      const body = await res.text()
      console.error('[Vercel] API error', res.status, body)
      return null
    }
    const data = await res.json() as {
      bandwidth?:              { used?: number }
      buildDurationInSeconds?: { used?: number }
    }
    return {
      bandwidthGB:  Math.round((data.bandwidth?.used ?? 0) / (1024 ** 3) * 10) / 10,
      buildMinutes: Math.round((data.buildDurationInSeconds?.used ?? 0) / 60),
    }
  } catch { return null }
}

type CloudflareStats = { requestsToday: number }

async function fetchCloudflareWorkerStats(): Promise<CloudflareStats | null> {
  const token      = process.env.CLOUDFLARE_API_TOKEN
  const accountId  = process.env.CLOUDFLARE_ACCOUNT_ID
  const workerName = process.env.CLOUDFLARE_WORKER_NAME
  if (!token || !accountId || !workerName) return null
  try {
    const now   = new Date()
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)

    const query = `{
      viewer {
        accounts(filter: { accountTag: "${accountId}" }) {
          workersInvocationsAdaptive(
            limit: 10000
            filter: {
              scriptName: "${workerName}"
              datetime_geq: "${start.toISOString()}"
              datetime_leq: "${now.toISOString()}"
            }
          ) {
            sum { requests }
          }
        }
      }
    }`

    const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json() as {
      data?: {
        viewer?: {
          accounts?: Array<{
            workersInvocationsAdaptive?: Array<{ sum?: { requests?: number } }>
          }>
        }
      }
    }
    const rows = data.data?.viewer?.accounts?.[0]?.workersInvocationsAdaptive ?? []
    const total = rows.reduce((acc, row) => acc + (row.sum?.requests ?? 0), 0)
    return { requestsToday: total }
  } catch { return null }
}

// ── page ──────────────────────────────────────────────────────────────────────

export default async function InfrastructurePage() {
  const supabase = createAdminClient()

  // ── Supabase / Resend (live from DB) ─────────────────────────────────────
  const now        = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

  const [
    { count: emailsThisMonth },
    { count: emailsToday },
    { count: activeUsers },
    upstash,
    sentry,
    vercel,
    cloudflare,
  ] = await Promise.all([
    supabase.from('notification_log').select('id', { count: 'exact', head: true }).gte('sent_at', monthStart),
    supabase.from('notification_log').select('id', { count: 'exact', head: true }).gte('sent_at', todayStart),
    supabase.from('users').select('id', { count: 'exact', head: true }),
    fetchUpstashStats(),
    fetchSentryStats(),
    fetchVercelUsage(),
    fetchCloudflareWorkerStats(),
  ])

  const resendMonth = emailsThisMonth ?? 0
  const resendDay   = emailsToday ?? 0
  const mau         = activeUsers ?? 0

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-ink">Infrastructure</h1>
        <p className="text-sm text-ink-muted mt-1">
          Free-tier usage across all services. Refreshed on every page load.
        </p>
      </div>

      {/* ── Live: Resend + Supabase ───────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-ink border-b border-line pb-2">Live usage</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Resend monthly */}
          <div className="bg-card border border-line rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-ink">Resend — emails this month</p>
                <p className="text-xs text-ink-muted mt-0.5">Free tier: 3,000 / month</p>
              </div>
              {statusBadge(pct(resendMonth, 3000))}
            </div>
            <Meter used={resendMonth} limit={3000} unit="emails" />
            <a href="https://resend.com/overview" target="_blank" rel="noopener noreferrer"
              className="text-xs text-brand hover:underline">
              Open Resend dashboard
            </a>
          </div>

          {/* Resend daily */}
          <div className="bg-card border border-line rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-ink">Resend — emails today</p>
                <p className="text-xs text-ink-muted mt-0.5">Free tier: 100 / day</p>
              </div>
              {statusBadge(pct(resendDay, 100))}
            </div>
            <Meter used={resendDay} limit={100} unit="emails" />
            <a href="https://resend.com/overview" target="_blank" rel="noopener noreferrer"
              className="text-xs text-brand hover:underline">
              Open Resend dashboard
            </a>
          </div>

          {/* Supabase MAU */}
          <div className="bg-card border border-line rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-ink">Supabase — active users</p>
                <p className="text-xs text-ink-muted mt-0.5">Free tier: 50,000 MAU</p>
              </div>
              {statusBadge(pct(mau, 50000))}
            </div>
            <Meter used={mau} limit={50000} unit="users" />
            <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer"
              className="text-xs text-brand hover:underline">
              Open Supabase dashboard
            </a>
          </div>

          {/* Upstash — live or static */}
          <div className="bg-card border border-line rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-ink">Upstash Redis — commands today</p>
                <p className="text-xs text-ink-muted mt-0.5">Free tier: 10,000 / day</p>
              </div>
              {upstash ? statusBadge(pct(upstash.dailyCommands, 10000)) : <NotConfigured />}
            </div>
            {upstash ? (
              <>
                <Meter used={upstash.dailyCommands} limit={10000} unit="commands" />
                <Meter used={upstash.storageMB}     limit={256}   unit="MB storage" />
              </>
            ) : (
              <ul className="text-sm text-ink-muted space-y-1">
                <li>Commands: <span className="text-ink font-medium">10,000 / day</span></li>
                <li>Storage: <span className="text-ink font-medium">256 MB</span></li>
                <li>Bandwidth: <span className="text-ink font-medium">200 MB / month</span></li>
              </ul>
            )}
            <a href="https://console.upstash.com" target="_blank" rel="noopener noreferrer"
              className="text-xs text-brand hover:underline">
              Open Upstash console
            </a>
          </div>

          {/* Sentry — live or static */}
          <div className="bg-card border border-line rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-ink">Sentry — errors this month</p>
                <p className="text-xs text-ink-muted mt-0.5">Free tier: 5,000 / month</p>
              </div>
              {sentry ? statusBadge(pct(sentry.errorsThisMonth, 5000)) : <NotConfigured />}
            </div>
            {sentry ? (
              <Meter used={sentry.errorsThisMonth} limit={5000} unit="errors" />
            ) : (
              <ul className="text-sm text-ink-muted space-y-1">
                <li>Errors: <span className="text-ink font-medium">5,000 / month</span></li>
                <li>Replays: <span className="text-ink font-medium">50 / month</span></li>
                <li>Retention: <span className="text-ink font-medium">30 days</span></li>
              </ul>
            )}
            <a href="https://sentry.io" target="_blank" rel="noopener noreferrer"
              className="text-xs text-brand hover:underline">
              Open Sentry dashboard
            </a>
          </div>

          {/* Cloudflare Workers — live or static */}
          <div className="bg-card border border-line rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-ink">Cloudflare Workers — requests today</p>
                <p className="text-xs text-ink-muted mt-0.5">Free tier: 100,000 / day</p>
              </div>
              {cloudflare ? statusBadge(pct(cloudflare.requestsToday, 100000)) : <NotConfigured />}
            </div>
            {cloudflare ? (
              <Meter used={cloudflare.requestsToday} limit={100000} unit="requests" />
            ) : (
              <ul className="text-sm text-ink-muted space-y-1">
                <li>Pages: <span className="text-ink font-medium">Unlimited requests</span></li>
                <li>Email routing: <span className="text-ink font-medium">Free</span></li>
                <li>Workers (chat fn): <span className="text-ink font-medium">100,000 req / day</span></li>
              </ul>
            )}
            <a href="https://dash.cloudflare.com" target="_blank" rel="noopener noreferrer"
              className="text-xs text-brand hover:underline">
              Open Cloudflare dashboard
            </a>
          </div>

          {/* Vercel — live or static */}
          <div className="bg-card border border-line rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-ink">Vercel — bandwidth this month</p>
                <p className="text-xs text-ink-muted mt-0.5">Free tier: 100 GB / month</p>
              </div>
              {vercel ? statusBadge(pct(vercel.bandwidthGB, 100)) : <NotConfigured />}
            </div>
            {vercel ? (
              <>
                <Meter used={vercel.bandwidthGB}  limit={100}  unit="GB bandwidth" />
                <Meter used={vercel.buildMinutes} limit={6000} unit="build minutes" />
              </>
            ) : (
              <ul className="text-sm text-ink-muted space-y-1">
                <li>Bandwidth: <span className="text-ink font-medium">100 GB / month</span></li>
                <li>Build minutes: <span className="text-ink font-medium">6,000 / month</span></li>
                <li>Serverless functions: <span className="text-ink font-medium">Unlimited</span></li>
              </ul>
            )}
            <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer"
              className="text-xs text-brand hover:underline">
              Open Vercel dashboard
            </a>
          </div>

        </div>
      </section>

      {/* ── Static reference cards ────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-ink border-b border-line pb-2">Reference — no public API available</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* Supabase DB + Storage */}
          <div className="bg-card border border-line rounded-xl p-5 space-y-3">
            <p className="text-sm font-semibold text-ink">Supabase — database &amp; storage</p>
            <ul className="text-sm text-ink-muted space-y-1">
              <li>Database: <span className="text-ink font-medium">500 MB</span></li>
              <li>File storage: <span className="text-ink font-medium">1 GB</span></li>
              <li>Bandwidth: <span className="text-ink font-medium">5 GB / month</span></li>
            </ul>
            <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer"
              className="text-xs text-brand hover:underline block">
              Open Supabase dashboard
            </a>
          </div>

          {/* Anthropic */}
          <div className="bg-card border border-line rounded-xl p-5 space-y-3">
            <p className="text-sm font-semibold text-ink">Anthropic — AI (pay as you go)</p>
            <ul className="text-sm text-ink-muted space-y-1">
              <li>Model: <span className="text-ink font-medium">Claude Haiku 4.5</span></li>
              <li>Est. spend: <span className="text-ink font-medium">~$1 / month</span></li>
              <li>Spend cap: <span className="text-ink font-medium">Set in console</span></li>
            </ul>
            <a href="https://console.anthropic.com/settings/billing" target="_blank" rel="noopener noreferrer"
              className="text-xs text-brand hover:underline block">
              Open Anthropic console
            </a>
          </div>

        </div>
      </section>

      <p className="text-xs text-ink-muted">
        Free tier limits are correct as of September 2026 and may change. Verify with each provider before assuming availability.
      </p>
    </div>
  )
}
