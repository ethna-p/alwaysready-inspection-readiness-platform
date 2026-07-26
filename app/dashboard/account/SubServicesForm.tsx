'use client'

import { useTransition } from 'react'
import { toggleSubService } from './actions'

const AVAILABLE_SUB_SERVICES: { value: string; label: string; description: string }[] = [
  {
    value: 'Dementia',
    label: 'Dementia care',
    description: 'Adds dementia-specific checklist items across relevant KLOEs, covering behaviour support, MCA/DoLS, life history, adapted activities, dementia-friendly environment, and specialist links.',
  },
  {
    value: 'Autism',
    label: 'Autism support',
    description: 'Adds autism-specific checklist items across relevant KLOEs, covering individual autism profiles, sensory needs, communication support, Oliver McGowan training, PBS and restrictive practice governance, and Right Support, Right Care, Right Culture (RSRCC).',
  },
  {
    value: 'Learning Disabilities',
    label: 'Learning disabilities',
    description: 'Adds learning disability-specific checklist items across relevant KLOEs, covering Registering the Right Support principles, Building the Right Support, easy-read communication, supported decision-making, and restrictions governance.',
  },
  {
    value: 'Mental Health',
    label: 'Mental health',
    description: 'Adds mental health-specific checklist items across relevant KLOEs, covering Mental Health Act compliance, Section 17 leave, tribunal processes, DoLS/LPS interface, and recovery-focused care planning.',
  },
  {
    value: 'End of Life',
    label: 'End of life / palliative care',
    description: 'Adds end of life-specific checklist items across relevant KLOEs, covering advance care planning, DNACPR processes, the AMBER care bundle, NICE guidelines, and Gold Standards Framework.',
  },
  {
    value: 'Acquired Brain Injury',
    label: 'Acquired brain injury (ABI)',
    description: 'Adds ABI-specific checklist items across relevant KLOEs, covering neurorehabilitation competencies, cognitive and neuropsychological assessment, supported decision-making with fluctuating capacity, MDT liaison, and behaviour support governance.',
  },
  {
    value: 'Physical Disabilities',
    label: 'Physical disabilities',
    description: 'Adds physical disability-specific checklist items across relevant KLOEs, covering moving and handling risk assessment, LOLER/PUWER equipment compliance, OT and physiotherapy assessment, independent living philosophy, and accessible environment governance.',
  },
  {
    value: 'Bariatric Care',
    label: 'Bariatric care',
    description: 'Adds bariatric-specific checklist items across relevant KLOEs, covering bariatric manual handling protocols, specialist equipment governance, nutritional and skin integrity assessment, dignity in care, and dietitian liaison.',
  },
  {
    value: 'Sensory Impairment',
    label: 'Sensory impairment',
    description: 'Adds sensory impairment-specific checklist items across relevant KLOEs, covering environmental adaptations, communication needs assessment, assistive technology, BSL and deafblind communication, and specialist sensory service liaison.',
  },
  {
    value: 'Epilepsy',
    label: 'Epilepsy',
    description: 'Adds epilepsy-specific checklist items across relevant KLOEs, covering individual seizure management plans, rescue medication governance, SUDEP awareness, seizure diary monitoring, risk-enabling care planning, and neurology liaison.',
  },
]

interface Props {
  enabledSubServices: string[]
}

export default function SubServicesForm({ enabledSubServices }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleChange(subService: string, label: string, checked: boolean) {
    // Confirm before disabling to reassure the user their data is safe
    if (!checked) {
      const confirmed = window.confirm(
        `Unticking "${label}" will hide these checklist items from your KLOEs.\n\nNo data will be deleted — tick it again at any time to restore everything.\n\nAre you sure?`
      )
      if (!confirmed) return
    }

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
                : 'border-line bg-card hover:border-line'
            } ${isPending ? 'opacity-60 pointer-events-none' : ''}`}
          >
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-line text-brand focus:ring-[#00b8a6]"
              checked={isEnabled}
              onChange={e => handleChange(ss.value, ss.label, e.target.checked)}
              disabled={isPending}
              aria-label={ss.label}
            />
            <div>
              <p className="text-sm font-medium text-ink">{ss.label}</p>
              <p className="text-sm text-ink-muted mt-0.5">{ss.description}</p>
            </div>
          </label>
        )
      })}
      {isPending && (
        <p className="text-xs text-ink-muted">Saving…</p>
      )}
    </div>
  )
}
