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

  // Demo banner
  if (isDemo) {
    const hours = hoursRemaining(demoExpiresAt)
    const days  = daysRemaining(demoExpiresAt)
    const timeLabel = days >= 2
      ? `${days} days`
      : hours <= 1
      ? 'less than an hour'
      : `${hours} hours`

    return (
      <div className="bg-[#014D4E] text-white print:hidden">
        <div className="max-w-7xl mx-auto px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">
            <span className="font-semibold">Demo mode</span>
            {' — '}
            your session expires in{' '}
            <span className="font-semibold">{timeLabel}</span>.
            {' '}Data resets when the session ends.
          </p>
          <a
            href="/signup"
            className="
              shrink-0 text-sm font-semibold
              bg-[#ffd700] text-[#014D4E]
              px-4 py-1.5 rounded-lg
              hover:bg-yellow-300
              focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#014D4E]
              transition-colors
            "
          >
            Start free trial →
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
          Subscribe now →
        </a>
      </div>
    </div>
  )
}
