'use client'

/**
 * /dashboard/account/mfa/setup — TOTP enrolment page.
 *
 * Reached either:
 *   a) Automatically by middleware (admin with no MFA factor enrolled)
 *   b) Voluntarily via the Account page "Set up two-factor authentication" link
 *
 * Flow:
 *   1. On mount: call mfa.enroll() to get QR code + secret
 *   2. User scans QR code with authenticator app (Google Authenticator, Authy, etc.)
 *   3. User enters 6-digit code to confirm enrolment
 *   4. challengeAndVerify() completes enrolment and upgrades session to aal2
 *   5. Redirect to /dashboard/account with success message
 */

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function MfaSetupPage() {
  return (
    <Suspense>
      <MfaSetupForm />
    </Suspense>
  )
}

function MfaSetupForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const supabase     = createClient()
  const isMandatory  = searchParams.get('required') === '1'

  const [factorId, setFactorId]   = useState<string | null>(null)
  const [qrCode, setQrCode]       = useState<string | null>(null)
  const [secret, setSecret]       = useState<string | null>(null)
  const [code, setCode]           = useState('')
  const [error, setError]         = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)
  const [initialising, setInitialising] = useState(true)
  const [showSecret, setShowSecret] = useState(false)

  useEffect(() => {
    async function enroll() {
      // Check if already enrolled — don't enroll twice
      const { data: factors } = await supabase.auth.mfa.listFactors()
      if (factors?.totp?.length) {
        // Already enrolled — go to account page
        router.replace('/dashboard/account')
        return
      }

      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator app',
      })

      if (enrollError || !data) {
        setError('Could not start setup. Please refresh and try again.')
        setInitialising(false)
        return
      }

      setFactorId(data.id)
      setQrCode(data.totp.qr_code)
      setSecret(data.totp.secret)
      setInitialising(false)
    }

    enroll()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!factorId) return

    setError(null)
    setLoading(true)

    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: code.replace(/\s/g, ''),
    })

    if (verifyError) {
      setError('Incorrect code. Check your authenticator app and try again.')
      setLoading(false)
      return
    }

    // Enrolment complete — session is now aal2
    router.replace('/dashboard/account?mfa=enrolled')
    router.refresh()
  }

  // Standalone layout (outside dashboard layout) for mandatory setup
  if (isMandatory) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex flex-col">
        <header className="px-6 py-4">
          <Image src="/alwaysready-logo.svg" alt="AlwaysReady" width={220} height={48} style={{ height: 'auto' }} priority />
        </header>
        <main className="flex-1 flex items-center justify-center px-4">
          <SetupCard
            initialising={initialising}
            qrCode={qrCode}
            secret={secret}
            showSecret={showSecret}
            setShowSecret={setShowSecret}
            code={code}
            setCode={setCode}
            error={error}
            loading={loading}
            onSubmit={handleVerify}
            mandatory
          />
        </main>
      </div>
    )
  }

  // Embedded in dashboard layout
  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#014D4E] mb-1">Set up two-factor authentication</h1>
        <p className="text-sm text-gray-600">Adds a second layer of security to your account.</p>
      </div>
      <SetupCard
        initialising={initialising}
        qrCode={qrCode}
        secret={secret}
        showSecret={showSecret}
        setShowSecret={setShowSecret}
        code={code}
        setCode={setCode}
        error={error}
        loading={loading}
        onSubmit={handleVerify}
        mandatory={false}
      />
    </div>
  )
}

// ── Shared card UI ────────────────────────────────────────────────────────────

type CardProps = {
  initialising: boolean
  qrCode: string | null
  secret: string | null
  showSecret: boolean
  setShowSecret: (v: boolean) => void
  code: string
  setCode: (v: string) => void
  error: string | null
  loading: boolean
  onSubmit: (e: React.FormEvent) => void
  mandatory: boolean
}

function SetupCard({
  initialising, qrCode, secret, showSecret, setShowSecret,
  code, setCode, error, loading, onSubmit, mandatory,
}: CardProps) {
  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      {mandatory && (
        <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          <strong>Action required.</strong> Two-factor authentication is mandatory for manager accounts. Please set it up to continue.
        </div>
      )}

      {initialising ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">Preparing setup…</p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h2 className="text-base font-semibold text-[#014D4E] mb-1">Step 1 — Scan the QR code</h2>
            <p className="text-sm text-gray-600 mb-4">
              Open your authenticator app (Google Authenticator, Authy, or similar) and scan this code.
            </p>

            {qrCode && (
              <div className="flex justify-center mb-3">
                {/* QR code is returned as a data URI SVG */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrCode} alt="MFA QR code" className="w-48 h-48 border border-gray-200 rounded-lg p-1" />
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="text-xs text-[#014D4E] hover:underline"
            >
              {showSecret ? 'Hide' : 'Can\'t scan? Enter code manually'}
            </button>

            {showSecret && secret && (
              <div className="mt-2 bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-xs text-gray-500 mb-1">Manual entry key:</p>
                <p className="font-mono text-sm text-[#1a1a1a] break-all">{secret}</p>
              </div>
            )}
          </div>

          <div className="mb-6">
            <h2 className="text-base font-semibold text-[#014D4E] mb-1">Step 2 — Enter the code</h2>
            <p className="text-sm text-gray-600 mb-4">
              Enter the 6-digit code shown in your authenticator app to confirm setup.
            </p>

            <form onSubmit={onSubmit} noValidate>
              {error && (
                <div role="alert" className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="mb-4">
                <label htmlFor="totp-code" className="block text-sm font-medium text-[#1a1a1a] mb-1">
                  Verification code
                </label>
                <input
                  id="totp-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="
                    w-full rounded-lg border border-gray-300 px-3 py-2
                    text-[#1a1a1a] text-sm bg-white text-center tracking-widest text-lg font-mono
                    focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:border-[#014D4E]
                  "
                />
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="
                  w-full rounded-lg bg-[#014D4E] text-white font-semibold
                  py-2.5 text-sm
                  hover:bg-[#013a3b]
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#014D4E]
                  disabled:opacity-60 disabled:cursor-not-allowed
                  transition-colors
                "
              >
                {loading ? 'Activating…' : 'Activate two-factor authentication'}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
