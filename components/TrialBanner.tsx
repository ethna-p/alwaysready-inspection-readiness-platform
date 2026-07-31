/**
 * TrialBanner — shown at the top of every dashboard page for trial users.
 * Displays a countdown and a subscribe CTA.
 * Active orgs: renders nothing.
 */

interface Props {
  subscriptionTier: string
  trialExpiresAt: string | null
}

function daysRemaining(iso: string | null): number {
  if (!iso) return 0
  const diff = new Date(iso).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export default function TrialBanner({ subscriptionTier, trialExpiresAt }: Props) {
  // Active subscribers: no banner
  if (subscriptionTier === 'active') return null

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
          Subscribe →
        </a>
      </div>
    </div>
  )
}
