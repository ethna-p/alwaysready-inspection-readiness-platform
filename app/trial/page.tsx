'use client'

/**
 * /trial — Self-service free trial signup.
 *
 * Collects service details and the Registered Manager's contact,
 * provisions a real organisation, and sends a password-setup email.
 * No payment required. Trial runs for 14 days.
 */

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { startTrial } from './actions'

const SERVICE_TYPES = [
  'ARBD Specialist Care Home',
  'Community Drug and Alcohol Service',
  'Dual-Registered Care Home',
  'Extra Care Housing',
  'Homecare Agency',
  'Nursing Home',
  'Residential Care Home',
  'Residential Rehabilitation Service',
  'Shared Lives Scheme',
  'Specialist College',
  'Supported Living',
] as const

const FEATURES = [
  ['KLOE tracker', 'All KLOEs with RAG status, priority, and next review dates'],
  ['Readiness dashboard', 'Your overall compliance position at a glance'],
  ['Daily Review Report', 'What needs attention today, sorted by priority'],
  ['Evidence uploads', 'Attach documents directly to each KLOE'],
  ['Audit trail', 'Every change recorded — who made it and when'],
  ['Inspection Pack', 'One-click printable summary for inspectors and boards'],
  ['HR module', 'Staff records, training, DBS, supervision, and appraisals'],
  ['Team access', 'Add staff and reviewer logins with role-based permissions'],
]

export default function TrialPage() {
  const router = useRouter()

  const [serviceName,      setServiceName]      = useState('')
  const [cqcLocationId,    setCqcLocationId]    = useState('')
  const [serviceType,      setServiceType]      = useState('')
  const [managerName,      setManagerName]      = useState('')
  const [managerEmail,     setManagerEmail]     = useState('')
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [error,            setError]            = useState<string | null>(null)
  const [isPending,        startTransition]     = useTransition()

  // CQC Location ID lookup state
  const [cqcLookupStatus,  setCqcLookupStatus]  = useState<'idle' | 'loading' | 'found' | 'not_found' | 'unavailable'>('idle')
  const [cqcFoundName,     setCqcFoundName]     = useState<string | null>(null)

  async function handleCqcLookup() {
    const id = cqcLocationId.trim()
    if (!id) return
    setCqcLookupStatus('loading')
    setCqcFoundName(null)
    try {
      const res  = await fetch(`/api/cqc-lookup?locationId=${encodeURIComponent(id)}`)
      const data = await res.json()
      if (data.found) {
        setCqcLookupStatus('found')
        setCqcFoundName(data.locationName ?? null)
        // Auto-fill service name if blank
        if (!serviceName.trim() && data.locationName) {
          setServiceName(data.locationName)
        }
      } else if (data.unavailable) {
        setCqcLookupStatus('unavailable')
      } else {
        setCqcLookupStatus('not_found')
      }
    } catch {
      setCqcLookupStatus('unavailable')  // network error — fail open
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await startTrial({
        serviceName,
        cqcLocationId,
        serviceType,
        managerName,
        managerEmail,
        marketingConsent,
      })

      if (!result.success) {
        setError(result.error)
        return
      }

      router.push(`/trial/confirmed?email=${encodeURIComponent(result.email)}`)
    })
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col">

      {/* Header */}
      <header className="bg-card border-b border-line px-6 py-4">
        <a href="https://www.alwaysready.uk" aria-label="AlwaysReady home">
          <Image
            src="/alwaysready-logo.svg"
            alt="AlwaysReady"
            width={180}
            height={40}
            style={{ height: 'auto' }}
            priority
          />
        </a>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">

          {/* ── Left: form ─────────────────────────────────────────────── */}
          <div>
            <div className="mb-8">
              <span className="inline-block text-xs font-bold text-[#014D4E] bg-[#00b8a6]/10 border border-[#00b8a6]/20 px-3 py-1 rounded-full uppercase tracking-widest mb-4">
                14-day free trial
              </span>
              <h1 className="text-3xl font-bold text-brand leading-tight mb-3">
                Start your free trial
              </h1>
              <p className="text-ink-dim leading-relaxed">
                Set up your account in under a minute. No payment required.
                Your data is private, secure, and yours from day one.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">

              {/* Service Name */}
              <div>
                <label htmlFor="service-name" className="block text-sm font-semibold text-ink mb-1">
                  Service name
                </label>
                <input
                  id="service-name"
                  type="text"
                  value={serviceName}
                  onChange={e => setServiceName(e.target.value)}
                  placeholder="e.g. Sunrise Residential Care Home"
                  required
                  disabled={isPending}
                  className="w-full rounded-xl border border-line px-4 py-3 text-sm text-ink bg-card placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:border-[#014D4E] disabled:opacity-60"
                />
              </div>

              {/* CQC Location ID */}
              <div>
                <label htmlFor="cqc-id" className="block text-sm font-semibold text-ink mb-1">
                  CQC Location ID
                </label>
                <input
                  id="cqc-id"
                  type="text"
                  value={cqcLocationId}
                  onChange={e => {
                    setCqcLocationId(e.target.value)
                    setCqcLookupStatus('idle')
                    setCqcFoundName(null)
                  }}
                  onBlur={handleCqcLookup}
                  placeholder="e.g. 1-1234567890"
                  required
                  disabled={isPending}
                  aria-describedby="cqc-id-hint cqc-id-feedback"
                  className="w-full rounded-xl border border-line px-4 py-3 text-sm text-ink bg-card placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:border-[#014D4E] disabled:opacity-60"
                />

                {/* Inline CQC lookup feedback */}
                <div id="cqc-id-feedback" aria-live="polite" className="mt-1.5 text-xs min-h-[1.25rem]">
                  {cqcLookupStatus === 'loading' && (
                    <span className="text-ink-muted flex items-center gap-1.5">
                      <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                      </svg>
                      Checking CQC register…
                    </span>
                  )}
                  {cqcLookupStatus === 'found' && cqcFoundName && (
                    <span className="text-green-700 flex items-center gap-1.5 font-medium">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Found: {cqcFoundName}
                    </span>
                  )}
                  {cqcLookupStatus === 'not_found' && (
                    <span className="text-red-700 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      We couldn&apos;t find that ID on the CQC register. Please double-check it — only CQC-registered services can sign up.
                    </span>
                  )}
                  {cqcLookupStatus === 'unavailable' && (
                    <span className="text-amber-700 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      We couldn&apos;t reach the CQC register right now — you can still continue.
                    </span>
                  )}
                </div>

                <p id="cqc-id-hint" className="text-sm text-ink-muted mt-1">
                  Found on your CQC registration certificate or at{' '}
                  <a href="https://www.cqc.org.uk/search-care-services" target="_blank" rel="noopener noreferrer" className="text-brand underline">
                    cqc.org.uk
                  </a>.
                </p>
              </div>

              {/* Service Type */}
              <div>
                <label htmlFor="service-type" className="block text-sm font-semibold text-ink mb-1">
                  Service type
                </label>
                <select
                  id="service-type"
                  value={serviceType}
                  onChange={e => setServiceType(e.target.value)}
                  required
                  disabled={isPending}
                  className="w-full rounded-xl border border-line px-4 py-3 text-sm text-ink bg-card focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:border-[#014D4E] disabled:opacity-60"
                >
                  <option value="">— Select your service type —</option>
                  {SERVICE_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Divider */}
              <div className="pt-1 pb-1 border-t border-line" />

              {/* Manager Name */}
              <div>
                <label htmlFor="manager-name" className="block text-sm font-semibold text-ink mb-1">
                  Registered Manager&apos;s name
                </label>
                <input
                  id="manager-name"
                  type="text"
                  value={managerName}
                  onChange={e => setManagerName(e.target.value)}
                  placeholder="Full name"
                  required
                  disabled={isPending}
                  autoComplete="name"
                  className="w-full rounded-xl border border-line px-4 py-3 text-sm text-ink bg-card placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:border-[#014D4E] disabled:opacity-60"
                />
              </div>

              {/* Manager Email */}
              <div>
                <label htmlFor="manager-email" className="block text-sm font-semibold text-ink mb-1">
                  Registered Manager&apos;s email address
                </label>
                <input
                  id="manager-email"
                  type="email"
                  value={managerEmail}
                  onChange={e => setManagerEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={isPending}
                  autoComplete="email"
                  className="w-full rounded-xl border border-line px-4 py-3 text-sm text-ink bg-card placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:border-[#014D4E] disabled:opacity-60"
                />
                <p className="text-sm text-ink-muted mt-1">
                  This will be your login email. We will send login details to that email.
                </p>
              </div>

              {/* Marketing consent */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={e => setMarketingConsent(e.target.checked)}
                  disabled={isPending}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-line text-brand focus:ring-2 focus:ring-[#014D4E] disabled:opacity-60"
                />
                <span className="text-sm text-ink-dim leading-relaxed">
                  Keep me updated with CQC news, inspection tips, and AlwaysReady resources.
                  You can unsubscribe at any time.{' '}
                  <a
                    href="https://www.alwaysready.uk/legal"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand underline"
                  >
                    Privacy policy
                  </a>
                </span>
              </label>

              {/* Error */}
              {error && (
                <div role="alert" className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isPending || cqcLookupStatus === 'not_found'}
                className="
                  w-full inline-flex items-center justify-center gap-2
                  bg-[#014D4E] text-white text-base font-bold
                  px-8 py-4 rounded-xl
                  hover:bg-[#013636]
                  focus:outline-none focus:ring-4 focus:ring-[#014D4E]/30
                  transition-colors
                  disabled:opacity-70 disabled:cursor-not-allowed
                "
              >
                {isPending ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                    </svg>
                    Setting up your account…
                  </>
                ) : (
                  <>
                    Start free trial
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>

              <p className="text-sm text-ink-muted text-center">
                No credit card required. Cancel any time.
              </p>

            </form>
          </div>

          {/* ── Right: what's included ──────────────────────────────────── */}
          <div className="lg:pt-[7.5rem]">
            <div className="bg-card rounded-2xl border border-line p-7 shadow-sm">
              <h2 className="text-sm font-bold text-brand uppercase tracking-widest mb-5">
                What&apos;s included in your trial
              </h2>
              <ul className="space-y-4">
                {FEATURES.map(([title, desc]) => (
                  <li key={title} className="flex items-start gap-3">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-[#014D4E]/10 flex items-center justify-center shrink-0" aria-hidden="true">
                      <svg className="w-3 h-3 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="text-sm text-ink">
                      <span className="font-semibold text-ink">{title}</span>
                      {' — '}
                      {desc}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-ink-dim">— and much more.</p>

              <div className="mt-4 pt-5 border-t border-line">
                <p className="text-sm text-ink-muted leading-relaxed">
                  Your trial gives you full access, and every piece of data you add is yours to keep.
                  Export it any time during your trial from your Account page, or subscribe and all
                  your work stays exactly where you left it.
                </p>
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-ink-muted">
                Already have an account?{' '}
                <a href="/login" className="text-brand font-semibold hover:underline">
                  Sign in
                </a>
              </p>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-line bg-canvas px-6 py-6 text-center">
        <p className="text-xs text-ink">
          &copy; 2026 AlwaysReady is a brand of Parker Digital &amp; Print Services Ltd. |
          Registered Office: 82A James Carter Road, Mildenhall, IP28 7DE
        </p>
        <p className="text-xs text-ink-muted mt-1 max-w-2xl mx-auto">
          Our tools are designed to support providers in preparing for CQC inspection.
          They do not constitute official CQC guidance and do not guarantee any
          particular inspection outcome.
        </p>
      </footer>

    </div>
  )
}
