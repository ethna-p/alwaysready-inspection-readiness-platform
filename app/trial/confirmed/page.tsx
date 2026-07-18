/**
 * /trial/confirmed — shown after a successful trial signup.
 * Tells the user to check their email for the password setup link.
 */
import Image from 'next/image'

interface Props {
  searchParams: Promise<{ email?: string }>
}

export default async function TrialConfirmedPage({ searchParams }: Props) {
  const { email } = await searchParams

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
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

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md text-center">

          {/* Icon */}
          <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-[#014D4E]/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-[#014D4E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-[#014D4E] mb-3">
            Check your email
          </h1>

          {email ? (
            <p className="text-gray-600 leading-relaxed mb-2">
              We have sent a password setup link to{' '}
              <span className="font-semibold text-[#1a1a1a]">{email}</span>.
            </p>
          ) : (
            <p className="text-gray-600 leading-relaxed mb-2">
              We have sent a password setup link to your email address.
            </p>
          )}

          <p className="text-gray-600 leading-relaxed mb-8">
            Click the link in the email to set your password and get into your
            account. It may take a minute or two to arrive.
          </p>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-left text-sm text-gray-600 space-y-2">
            <p className="font-semibold text-[#1a1a1a]">Can&apos;t find the email?</p>
            <p>Check your spam or junk folder. If it still hasn&apos;t arrived after five minutes, you can use the <a href="/login" className="text-[#014D4E] underline font-medium">forgot password</a> link on the sign-in page to request a new one.</p>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-[#faf9f6] px-6 py-6 text-center">
        <p className="text-xs text-[#1a1a1a]">
          &copy; 2026 AlwaysReady is a brand of Parker Digital &amp; Print Services Ltd. |
          Registered Office: 82A James Carter Road, Mildenhall, IP28 7DE
        </p>
      </footer>

    </div>
  )
}
