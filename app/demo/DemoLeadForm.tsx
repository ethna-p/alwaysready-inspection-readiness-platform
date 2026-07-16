'use client'

import { useRef, useState } from 'react'
import { saveDemoLead } from './actions'

export default function DemoLeadForm() {
  const [pending, setPending] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    const formData = new FormData(e.currentTarget)
    await saveDemoLead(formData)
    // redirect() in the server action will navigate away;
    // if for some reason it doesn't, re-enable the button
    setPending(false)
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="w-full max-w-sm mx-auto space-y-3"
      noValidate
    >
      {/* First name */}
      <div>
        <label htmlFor="demo-first-name" className="sr-only">
          First name
        </label>
        <input
          id="demo-first-name"
          name="first_name"
          type="text"
          autoComplete="given-name"
          required
          placeholder="First name"
          disabled={pending}
          className="
            w-full rounded-xl px-4 py-3 text-sm text-[#1a1a1a]
            bg-white/95 placeholder-gray-400
            border border-white/20
            focus:outline-none focus:ring-2 focus:ring-[#ffd700]
            disabled:opacity-60
          "
        />
      </div>

      {/* Last name */}
      <div>
        <label htmlFor="demo-last-name" className="sr-only">
          Last name
        </label>
        <input
          id="demo-last-name"
          name="last_name"
          type="text"
          autoComplete="family-name"
          required
          placeholder="Last name"
          disabled={pending}
          className="
            w-full rounded-xl px-4 py-3 text-sm text-[#1a1a1a]
            bg-white/95 placeholder-gray-400
            border border-white/20
            focus:outline-none focus:ring-2 focus:ring-[#ffd700]
            disabled:opacity-60
          "
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="demo-email" className="sr-only">
          Email address
        </label>
        <input
          id="demo-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="Email address"
          disabled={pending}
          className="
            w-full rounded-xl px-4 py-3 text-sm text-[#1a1a1a]
            bg-white/95 placeholder-gray-400
            border border-white/20
            focus:outline-none focus:ring-2 focus:ring-[#ffd700]
            disabled:opacity-60
          "
        />
      </div>

      {/* Blog / newsletter opt-in — unticked by default (GDPR) */}
      <label className="flex items-start gap-3 text-left cursor-pointer">
        <input
          type="checkbox"
          name="marketing_consent"
          disabled={pending}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/30 bg-white/90 text-[#014D4E] focus:ring-2 focus:ring-[#ffd700] disabled:opacity-60"
        />
        <span className="text-xs text-white/70 leading-relaxed">
          Keep me updated with CQC news, inspection tips, and resources from AlwaysReady.
          You can unsubscribe at any time.{' '}
          <a
            href="https://alwaysready.uk/legal"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white/90"
          >
            Privacy policy
          </a>
        </span>
      </label>

      {/* Submit */}
      <button
        type="submit"
        disabled={pending}
        className="
          w-full inline-flex items-center justify-center gap-2
          bg-[#ffd700] text-[#014D4E] text-base font-bold
          px-8 py-4 rounded-xl
          hover:bg-yellow-300
          focus:outline-none focus:ring-4 focus:ring-[#ffd700]/50
          transition-colors
          disabled:opacity-70 disabled:cursor-not-allowed
        "
      >
        {pending ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
            </svg>
            Setting up your demo…
          </>
        ) : (
          <>
            Start your free demo
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </>
        )}
      </button>
    </form>
  )
}
