'use client'

import { useTransition } from 'react'
import { toggleSubService } from './actions'

const AVAILABLE_SUB_SERVICES: { value: string; label: string; description: string }[] = [
  {
    value: 'Dementia',
    label: 'Dementia care',
    description: 'Adds dementia-specific checklist items across all KLOEs, covering behaviour support, MCA/DoLS, life history, adapted activities, dementia-friendly environment, and specialist links.',
  },
  {
    value: 'Autism',
    label: 'Autism support',
    description: 'Adds autism-specific checklist items across all KLOEs, covering individual autism profiles, sensory needs, communication support, Oliver McGowan training, PBS and restrictive practice governance, and Right Support, Right Care, Right Culture (RSRCC).',
  },
]

interface Props {
  enabledSubServices: string[]
}

export default function SubServicesForm({ enabledSubServices }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleChange(subService: string, checked: boolean) {
    startTransition(async () => {
      await toggleSubService(subService, checked)
    })
  }

  return (
    <div className="space-y-4">
      {AVAILABLE_SUB_SERVICES.map(ss => {
        const isEnabled = enabledSubServices.includes(ss.value)
        return (
          <label
            key={ss.value}
            className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
              isEnabled
                ? 'border-[#00b8a6] bg-[#f0fdfb]'
                : 'border-gray-200 bg-white hover:border-gray-300'
            } ${isPending ? 'opacity-60 pointer-events-none' : ''}`}
          >
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#014D4E] focus:ring-[#00b8a6]"
              checked={isEnabled}
              onChange={e => handleChange(ss.value, e.target.checked)}
              disabled={isPending}
              aria-label={ss.label}
            />
            <div>
              <p className="text-sm font-medium text-[#1a1a1a]">{ss.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{ss.description}</p>
            </div>
          </label>
        )
      })}
      {isPending && (
        <p className="text-xs text-gray-400">Saving…</p>
      )}
    </div>
  )
}
