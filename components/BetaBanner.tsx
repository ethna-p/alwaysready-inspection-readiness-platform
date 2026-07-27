/**
 * BetaBanner — a slim, non-pushy banner shown to active trial users
 * inviting them to join the Beta Partner Programme at £50/month.
 * Hidden for active subscribers, beta users, and demo orgs.
 */

interface Props {
  subscriptionTier: string
  isDemo: boolean
  isBeta: boolean
}

export default function BetaBanner({ subscriptionTier, isDemo, isBeta }: Props) {
  // Only show to trial users who are not already beta or demo
  if (subscriptionTier !== 'trial' || isDemo || isBeta) return null

  return (
    <div className="print:hidden bg-[#E6F5F3] border-b border-[#00b8a6]">
      <div className="max-w-7xl mx-auto px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <svg width="18" height="18" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="shrink-0">
            <circle cx="11" cy="11" r="11" fill="#ffd700"/>
            <path d="M6 11.5l3.5 3.5 6.5-7" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="text-sm text-[#014D4E]">
            Help shape AlwaysReady by joining our Beta Partner Programme — £50/month, locked in forever.*
          </p>
        </div>
        <a
          href="/upgrade/beta"
          className="
            shrink-0 text-sm font-semibold text-[#014D4E]
            underline underline-offset-2
            hover:text-[#00b8a6]
            focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-1
            transition-colors
          "
        >
          Find out more
        </a>
      </div>
    </div>
  )
}
