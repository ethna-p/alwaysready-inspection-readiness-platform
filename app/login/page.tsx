'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

/**
 * Login page.
 *
 * Accepts either:
 *   - A real email address (admin accounts)
 *   - A username (staff accounts, e.g. sarah.jones.f7a2e1)
 *     The login page appends @staff.alwaysready.uk before calling Supabase auth.
 *
 * After successful login, redirects based on role:
 *   admin / viewer → /dashboard
 *   user           → /dashboard/my-kloes
 */

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [login, setLogin]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Resolve email — if no @ present, treat as staff username
    const email = login.includes('@')
      ? login.trim()
      : `${login.trim()}@staff.alwaysready.uk`

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Incorrect login ID or password. Please try again.')
      setLoading(false)
      return
    }

    // Fetch role to decide where to redirect
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'user') {
        router.push('/dashboard/my-kloes')
      } else {
        router.push('/dashboard')
      }
    } else {
      router.push('/dashboard')
    }

    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col">
      {/* Top bar with logo */}
      <header className="px-6 py-4">
        <Image
          src="/alwaysready-logo.svg"
          alt="AlwaysReady"
          width={220}
          height={48}
          style={{ height: 'auto' }}
          priority
        />
      </header>

      {/* Login card — centred */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h1 className="text-2xl font-bold text-[#014D4E] mb-1">
              Sign in
            </h1>
            <p className="text-sm text-[#1a1a1a] mb-6">
              Inspection Readiness Platform
            </p>

            <form onSubmit={handleLogin} noValidate>
              {error && (
                <div
                  role="alert"
                  className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <div className="mb-4">
                <label
                  htmlFor="login"
                  className="block text-sm font-medium text-[#1a1a1a] mb-1"
                >
                  Email or login ID
                </label>
                <input
                  id="login"
                  type="text"
                  autoComplete="username"
                  required
                  value={login}
                  onChange={e => setLogin(e.target.value)}
                  placeholder="e.g. sarah.jones.f7a2e1"
                  className="
                    w-full rounded-lg border border-gray-300 px-3 py-2
                    text-[#1a1a1a] text-sm bg-white placeholder:text-gray-400
                    focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:border-[#014D4E]
                  "
                />
                <p className="text-xs text-gray-500 mt-1">
                  Managers: use your email address. Staff: use the login ID given to you.
                </p>
              </div>

              <div className="mb-6">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-[#1a1a1a] mb-1"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="
                    w-full rounded-lg border border-gray-300 px-3 py-2
                    text-[#1a1a1a] text-sm bg-white
                    focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:border-[#014D4E]
                  "
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="
                  w-full rounded-lg bg-[#014D4E] text-white font-semibold
                  py-2.5 text-sm
                  hover:bg-[#013a3b]
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#014D4E]
                  disabled:opacity-60 disabled:cursor-not-allowed
                  transition-colors
                "
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}

function SiteFooter() {
  return (
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
    </footer>
  )
}
