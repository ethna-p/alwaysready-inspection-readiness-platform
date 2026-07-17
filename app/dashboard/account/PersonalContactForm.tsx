'use client'

/**
 * PersonalContactForm — lets staff add/update their personal email
 * and mobile number for notifications.
 */

import { useActionState } from 'react'
import { updatePersonalContact } from './actions'
import type { UpdateContactResult } from './actions'

interface Props {
  personalEmail: string | null
  mobileNumber:  string | null
}

export default function PersonalContactForm({ personalEmail, mobileNumber }: Props) {
  const [state, formAction, isPending] = useActionState<UpdateContactResult | null, FormData>(
    updatePersonalContact,
    null
  )

  return (
    <form action={formAction} className="space-y-4">
      {/* Personal email */}
      <div>
        <label htmlFor="personal_email" className="block text-sm font-medium text-[#1a1a1a] mb-1">
          Personal email
        </label>
        <input
          type="email"
          id="personal_email"
          name="personal_email"
          defaultValue={personalEmail ?? ''}
          placeholder="e.g. yourname@gmail.com"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-[#1a1a1a] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:border-[#014D4E]"
        />
        <p className="text-xs text-gray-500 mt-1">
          We&apos;ll send password change notifications here.
        </p>
      </div>

      {/* Mobile number */}
      <div>
        <label htmlFor="mobile_number" className="block text-sm font-medium text-[#1a1a1a] mb-1">
          Mobile number
        </label>
        <input
          type="tel"
          id="mobile_number"
          name="mobile_number"
          defaultValue={mobileNumber ?? ''}
          placeholder="e.g. 07700 900123"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-[#1a1a1a] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:border-[#014D4E]"
        />
        <p className="text-xs text-gray-500 mt-1">
          Reserved for future WhatsApp notifications.
        </p>
      </div>

      {/* Feedback */}
      {state && !state.success && (
        <div role="alert" className="rounded-lg px-4 py-3 text-sm bg-red-50 text-red-800 border border-red-200">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div role="status" className="rounded-lg px-4 py-3 text-sm bg-green-50 text-green-800 border border-green-200">
          Contact details saved.
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="
          bg-[#014D4E] text-white text-sm font-medium
          px-5 py-2.5 rounded-lg
          hover:bg-[#013838]
          focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
        "
      >
        {isPending ? 'Saving…' : 'Save contact details'}
      </button>
    </form>
  )
}
