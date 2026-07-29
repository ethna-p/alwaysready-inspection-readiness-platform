'use client'

/**
 * OnboardingChecklist — shown to new users on their first login.
 * Dismissed by clicking "Got it" which marks onboarding_complete = true.
 * Once dismissed it never appears again.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { dismissOnboarding } from '@/app/actions/onboarding'

const STEPS = [
  {
    number: '1',
    title:  'Set your RAG status',
    detail: 'Open any KLOE under the KLOEs tab and set it to Red, Amber, or Green based on your current position.',
    href:   '/dashboard/kloes',
    cta:    'Go to KLOEs →',
  },
  {
    number: '2',
    title:  'Upload your first piece of evidence',
    detail: 'Attach a policy, audit, or certificate directly to a KLOE so you can demonstrate compliance during inspection.',
    href:   '/dashboard/kloes',
    cta:    'Go to KLOEs →',
  },
  {
    number: '3',
    title:  'Invite a colleague',
    detail: 'Give your deputy or a reviewer their own login. You control what they can see and edit.',
    href:   '/dashboard/account?tab=team',
    cta:    'Go to Team settings →',
  },
]

export default function OnboardingChecklist() {
  const router = useRouter()
  const [dismissed, setDismissed] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (dismissed) return null

  function handleDismiss() {
    startTransition(async () => {
      await dismissOnboarding()
      setDismissed(true)
      router.refresh()
    })
  }

  return (
    <div className="bg-[#014D4E]/5 border border-[#00b8a6]/30 rounded-xl p-6 mb-6">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="text-base font-bold text-brand mb-1">
            Welcome to AlwaysReady — here&apos;s where to start
          </h2>
          <p className="text-sm text-ink-dim">
            Three quick steps to get your account working for you.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          disabled={isPending}
          className="shrink-0 text-xs text-ink-muted hover:text-ink transition-colors disabled:opacity-50 cursor-pointer"
          aria-label="Dismiss onboarding checklist"
        >
          Dismiss
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STEPS.map(step => (
          <div
            key={step.number}
            className="bg-card border border-line rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-[#014D4E] text-white text-xs font-bold flex items-center justify-center shrink-0">
                {step.number}
              </span>
              <p className="text-sm font-semibold text-ink">{step.title}</p>
            </div>
            <p className="text-sm text-ink-dim leading-relaxed mb-3">
              {step.detail}
            </p>
            <a
              href={step.href}
              className="text-sm font-medium text-[#00b8a6] hover:text-[#009d8e] transition-colors"
            >
              {step.cta}
            </a>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-[#00b8a6]/20 flex items-center justify-between">
        <p className="text-xs text-ink-muted">
          Need help? Use the <strong>Support</strong> tab at any time.
        </p>
        <button
          onClick={handleDismiss}
          disabled={isPending}
          className="text-xs font-semibold text-[#014D4E] hover:text-[#00b8a6] transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isPending ? 'Saving…' : 'Got it, dismiss'}
        </button>
      </div>
    </div>
  )
}
