/**
 * /superadmin/infrastructure — free-tier usage monitor.
 *
 * Live data: Resend email count (from notification_log) and Supabase
 * active user count (as an MAU proxy).
 *
 * Static reference cards for Upstash, Vercel, Sentry, and Anthropic
 * link directly to each service's dashboard.
 */

import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// ─── helpers ──────────────────────────────────────────────────────────────────

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

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function InfrastructurePage() {
  const supabase = createAdminClient()

  // ── Resend: count emails from notification_log ────────────────────────────
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

  const { count: emailsThisMonth } = await supabase
    .from('notification_log')
    .select('id', { count: 'exact', head: true })
    .gte('sent_at', monthStart)

  const { count: emailsToday } = await supabase
    .from('notification_log')
    .select('id', { count: 'exact', head: true })
    .gte('sent_at', todayStart)

  // ── Supabase: active users (MAU proxy) ───────────────────────────────────
  const { count: activeUsers } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })

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

      {/* ── Live: Resend ──────────────────────────────────────────────────── */}
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
            <a
              href="https://resend.com/overview"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand hover:underline"
            >
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
            <a
              href="https://resend.com/overview"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand hover:underline"
            >
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
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand hover:underline"
            >
              Open Supabase dashboard
            </a>
          </div>

        </div>
      </section>

      {/* ── Static reference cards ────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-ink border-b border-line pb-2">Reference limits — check dashboards manually</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* Supabase DB + Storage */}
          <div className="bg-card border border-line rounded-xl p-5 space-y-3">
            <p className="text-sm font-semibold text-ink">Supabase — database &amp; storage</p>
            <ul className="text-sm text-ink-muted space-y-1">
              <li>Database: <span className="text-ink font-medium">500 MB</span></li>
              <li>File storage: <span className="text-ink font-medium">1 GB</span></li>
              <li>Bandwidth: <span className="text-ink font-medium">5 GB / month</span></li>
            </ul>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand hover:underline block"
            >
              Open Supabase dashboard
            </a>
          </div>

          {/* Upstash */}
          <div className="bg-card border border-line rounded-xl p-5 space-y-3">
            <p className="text-sm font-semibold text-ink">Upstash Redis — rate limiting</p>
            <ul className="text-sm text-ink-muted space-y-1">
              <li>Commands: <span className="text-ink font-medium">10,000 / day</span></li>
              <li>Storage: <span className="text-ink font-medium">256 MB</span></li>
              <li>Bandwidth: <span className="text-ink font-medium">200 MB / month</span></li>
            </ul>
            <a
              href="https://console.upstash.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand hover:underline block"
            >
              Open Upstash console
            </a>
          </div>

          {/* Vercel */}
          <div className="bg-card border border-line rounded-xl p-5 space-y-3">
            <p className="text-sm font-semibold text-ink">Vercel — platform hosting</p>
            <ul className="text-sm text-ink-muted space-y-1">
              <li>Bandwidth: <span className="text-ink font-medium">100 GB / month</span></li>
              <li>Build minutes: <span className="text-ink font-medium">6,000 / month</span></li>
              <li>Serverless functions: <span className="text-ink font-medium">Unlimited</span></li>
            </ul>
            <a
              href="https://vercel.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand hover:underline block"
            >
              Open Vercel dashboard
            </a>
          </div>

          {/* Sentry */}
          <div className="bg-card border border-line rounded-xl p-5 space-y-3">
            <p className="text-sm font-semibold text-ink">Sentry — error monitoring</p>
            <ul className="text-sm text-ink-muted space-y-1">
              <li>Errors: <span className="text-ink font-medium">5,000 / month</span></li>
              <li>Replays: <span className="text-ink font-medium">50 / month</span></li>
              <li>Retention: <span className="text-ink font-medium">30 days</span></li>
            </ul>
            <a
              href="https://sentry.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand hover:underline block"
            >
              Open Sentry dashboard
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
            <a
              href="https://console.anthropic.com/settings/billing"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand hover:underline block"
            >
              Open Anthropic console
            </a>
          </div>

          {/* Cloudflare */}
          <div className="bg-card border border-line rounded-xl p-5 space-y-3">
            <p className="text-sm font-semibold text-ink">Cloudflare — marketing site &amp; email</p>
            <ul className="text-sm text-ink-muted space-y-1">
              <li>Pages: <span className="text-ink font-medium">Unlimited requests</span></li>
              <li>Email routing: <span className="text-ink font-medium">Free</span></li>
              <li>Workers (chat fn): <span className="text-ink font-medium">100,000 req / day</span></li>
            </ul>
            <a
              href="https://dash.cloudflare.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand hover:underline block"
            >
              Open Cloudflare dashboard
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
