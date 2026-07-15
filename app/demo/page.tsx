/**
 * /demo — Demo landing page
 *
 * Public page (no auth required). Clicking "Start demo" sends the
 * visitor to GET /demo which bootstraps their private shadow org
 * and redirects them to the dashboard.
 */
import Image from 'next/image'
import Link from 'next/link'

type Props = {
  searchParams: Promise<{ error?: string }>
}

const ERROR_MESSAGES: Record<string, string> = {
  create:     'We could not create your demo session. Please try again.',
  seed:       'We could not load demo data. Please try again.',
  signin:     'We could not sign you in. Please try again.',
  unexpected: 'Something went wrong. Please try again in a moment.',
}

export default async function DemoPage({ searchParams }: Props) {
  const { error } = await searchParams
  const errorMessage = error ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.unexpected) : null

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col">

      {/* Minimal header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <a href="/" aria-label="AlwaysReady home">
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

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-xl w-full text-center">

          {/* Badge */}
          <span className="inline-block text-xs font-bold text-[#014D4E] bg-[#014D4E]/10 px-3 py-1 rounded-full uppercase tracking-widest mb-6">
            Interactive demo
          </span>

          <h1 className="text-4xl font-bold text-[#014D4E] leading-tight mb-4">
            See AlwaysReady in action
          </h1>

          <p className="text-lg text-gray-600 mb-3 leading-relaxed">
            Your own private demo environment, pre-loaded with realistic data for{' '}
            <span className="font-semibold text-[#1a1a1a]">Sunrise Residential Care Home</span>.
          </p>

          <p className="text-sm text-gray-500 mb-8">
            No sign-up required. Your session is fully isolated — no one else
            can see your data, and it is automatically cleared after 7 days.
          </p>

          {/* Error message */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3"
            >
              {errorMessage}
            </div>
          )}

          {/* CTA */}
          <a
            href="/demo/start"
            className="
              inline-flex items-center justify-center gap-2
              bg-[#014D4E] text-white text-base font-semibold
              px-8 py-4 rounded-xl
              hover:bg-[#013838]
              focus:outline-none focus:ring-4 focus:ring-[#014D4E]/30
              transition-colors
              w-full sm:w-auto
            "
            aria-label="Start your free demo of AlwaysReady"
          >
            Start your free demo
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>

          <p className="text-xs text-gray-400 mt-4">
            Takes about 2 seconds to load. Nothing to install.
          </p>

          {/* What you'll see */}
          <div className="mt-12 text-left bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-[#014D4E] uppercase tracking-widest mb-4">
              What you'll see
            </h2>
            <ul className="space-y-3 text-sm text-gray-700">
              {[
                ['Readiness dashboard', 'Overall % and per-key-question breakdown at a glance'],
                ['Full KLOE tracker', 'All 24 KLOEs with RAG status, priority, and next review dates'],
                ['Daily Review Report', 'What needs attention today — overdue and due soon, sorted by priority'],
                ['Audit trail timeline', 'Every change to every KLOE, with who made it and when'],
                ['Readiness trend', '8-week history showing your compliance improving over time'],
                ['Inspection Pack', 'One-click printable summary to hand to an inspector or board'],
              ].map(([title, desc]) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-[#014D4E]/10 flex items-center justify-center shrink-0" aria-hidden="true">
                    <svg className="w-3 h-3 text-[#014D4E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span>
                    <span className="font-semibold text-[#1a1a1a]">{title}</span>
                    {' — '}
                    {desc}
                  </span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-[#faf9f6] px-6 py-6 text-center">
        <p className="text-xs text-[#1a1a1a]">
          © 2026 AlwaysReady is a brand of Parker Digital &amp; Print Services Ltd. |
          Registered Office: 82A James Carter Road, Mildenhall, IP28 7DE
        </p>
        <p className="text-xs text-[#1a1a1a] mt-1 max-w-2xl mx-auto">
          Our tools are designed to support providers in preparing for CQC inspection.
          They do not constitute official CQC guidance and do not guarantee any
          particular inspection outcome.
        </p>
        <p className="text-xs text-gray-400 mt-3">
          Already have an account?{' '}
          <Link href="/login" className="text-[#014D4E] underline hover:no-underline">
            Sign in
          </Link>
        </p>
      </footer>

    </div>
  )
}
