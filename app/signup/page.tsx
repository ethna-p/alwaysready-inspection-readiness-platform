/**
 * /signup — self-service registration.
 * Creates an org with a 7-day trial, seeds 24 compliance records,
 * and signs the user in automatically.
 */
'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signUp, type SignUpState } from './actions'

const SERVICE_TYPES = [
  'Residential Care Home',
  'Nursing Home',
  'Dual-Registered Care Home',
  'Domiciliary Care',
  'Supported Living',
  'Extra Care Housing',
  'Shared Lives',
]

const inputClass = `
  w-full border border-gray-300 rounded-lg
  px-4 py-2.5 text-sm text-[#1a1a1a]
  focus:outline-none focus:ring-2 focus:ring-[#00b8a6] focus:border-transparent
`

export default function SignUpPage() {
  const [state, action, pending] = useActionState<SignUpState, FormData>(
    signUp,
    { status: 'idle' }
  )

  return (
    <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center px-6 py-12">
      <div className="max-w-lg w-full">

        {/* Logo */}
        <div className="mb-8 text-center">
          <a href="https://alwaysready.uk">
            <span className="inline-block text-3xl font-extrabold tracking-tight text-[#014D4E]">
              Always<span className="text-[#014D4E]">Ready</span>
            </span>
          </a>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <h1 className="text-2xl font-bold text-[#014D4E] mb-1">
            Start your free trial
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            7 days free. No credit card required.
          </p>

          {state.status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-6">
              {state.message}
            </div>
          )}

          <form action={action} className="space-y-4">

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-1" htmlFor="full_name">
                Your full name <span className="text-red-500">*</span>
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                autoComplete="name"
                placeholder="Jane Smith"
                className={inputClass}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-1" htmlFor="email">
                Work email address <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="jane@yourorganisation.com"
                className={inputClass}
              />
            </div>

            {/* Organisation name */}
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-1" htmlFor="org_name">
                Organisation name <span className="text-red-500">*</span>
              </label>
              <input
                id="org_name"
                name="org_name"
                type="text"
                required
                placeholder="Sunrise Care Home"
                className={inputClass}
              />
            </div>

            {/* Service type */}
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-1" htmlFor="service_type">
                Service type <span className="text-red-500">*</span>
              </label>
              <select
                id="service_type"
                name="service_type"
                required
                className={inputClass}
              >
                <option value="">Select your service type…</option>
                {SERVICE_TYPES.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-1" htmlFor="password">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className={inputClass}
              />
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-1" htmlFor="password2">
                Confirm password <span className="text-red-500">*</span>
              </label>
              <input
                id="password2"
                name="password2"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Repeat your password"
                className={inputClass}
              />
            </div>

            {/* Terms notice */}
            <p className="text-xs text-gray-600 leading-relaxed pt-1">
              By creating an account you agree to our{' '}
              <a
                href="https://alwaysready.uk/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-[#014D4E]"
              >
                Terms of Service
              </a>
              {' '}and{' '}
              <a
                href="https://alwaysready.uk/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-[#014D4E]"
              >
                Privacy Policy
              </a>
              .
            </p>

            <button
              type="submit"
              disabled={pending}
              className="
                w-full
                bg-[#014D4E] text-white
                font-semibold text-sm
                py-3 rounded-xl
                hover:bg-[#013636]
                focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
              "
            >
              {pending ? 'Creating your account…' : 'Create free account →'}
            </button>

          </form>
        </div>

        {/* Login link */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-[#014D4E] hover:underline">
            Log in
          </Link>
        </p>

      </div>
    </div>
  )
}
