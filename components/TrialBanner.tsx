/**
 * TrialBanner — shown at the top of every dashboard page for
 * demo and trial users. Displays a countdown and a subscribe CTA.
 *
 * Demo orgs:  counts down demo_expires_at
 * Trial orgs: counts down trial_expires_at
 * Active orgs: renders nothing
 */

interface Props {
  isDemo: boolean
  demoExpiresAt: string | null
  subscriptionTier: string
  trialExpiresAt: string | null
}

function daysRemaining(iso: string | null): number {
  if (!iso) return 0
  const diff = new Date(iso).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function hoursRemaining(iso: string | null): number {
  if (!iso) return 0
  const diff = new Date(iso).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60)))
}

export default function TrialBanner({ isDemo, demoExpiresAt, subscriptionTier, trialExpiresAt }: Props) {
  // Active subscribers: no banner
  if (!isDemo && subscriptionTier === 'active') return null

  // Permanent preview accounts (is_demo=true, active, no expiry): no banner
  if (isDemo && subscriptionTier === 'active' && !demoExpiresAt) return null

  // Demo banner — shown to real demo visitors
  if (isDemo) {
    return (
      <div className="bg-[#014D4E] text-white print:hidden">
        <div className="max-w-7xl mx-auto px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm">
              <span className="font-semibold">You&apos;re exploring AlwaysReady</span>
              {' — '}
              launching Autumn 2026. Impressed? Join the waitlist for early access.
            </p>
            <p className="text-xs text-white/75 mt-0.5">
              KLOEs in this demo are based on the CQC draft adult social care assessment framework (March 2026).
            </p>
          </div>
          <a
            href="https://alwaysready.uk/waitlist"
            target="_blank"
            rel="noopener noreferrer"
            className="
              shrink-0 text-sm font-semibold
              bg-[#ffd700] text-[#014D4E]
              px-4 py-1.5 rounded-lg
              hover:bg-yellow-300
              focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#014D4E]
              transition-colors
            "
          >
            Join the Waitlist →
          </a>
        </div>
      </div>
    )
  }

  // Trial banner
  const days = daysRemaining(trialExpiresAt)
  const urgency = days <= 3

  return (
    <div className={`print:hidden ${urgency ? 'bg-red-700' : 'bg-[#014D4E]'} text-white`}>
      <div className="max-w-7xl mx-auto px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">
          <span className="font-semibold">Free trial</span>
          {' — '}
          {days === 0
            ? 'your access expires today.'
            : (
              <>
                <span className="font-semibold">{days} {days === 1 ? 'day' : 'days'}</span>
                {' remaining in your free period.'}
              </>
            )}
        </p>
        <a
          href="/upgrade"
          className="
            shrink-0 text-sm font-semibold
            bg-[#ffd700] text-[#014D4E]
            px-4 py-1.5 rounded-lg
            hover:bg-yellow-300
            focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#014D4E]
            transition-colors
          "
        >
          SUBSCRIBE HERE
        </a>
      </div>
    </div>
  )
}
