'use client'

/**
 * ChecklistPanel — displays and manages the compliance sub-checklist for a KLOE.
 *
 * Layout:
 *   Core items first (for Dual-Reg: sub-grouped Residential / Nursing)
 *   Dementia Care items second (universal, shown to all service types)
 *
 * Each item: checkbox | ref badge | checklist text | regulation tag
 *   + collapsible evidence location field
 *
 * Interactions:
 *   - Checkbox toggles is_complete immediately (optimistic + server action)
 *   - Evidence location: text field, saved via "Save" button
 */

import { useOptimistic, useTransition, useState, useRef } from 'react'
import { upsertChecklistCompletion } from './checklist-actions'
import type { KloChecklistItem, KloChecklistCompletion } from '@/lib/types'

// ─── Types ──────────────────────────────────────────────────────────────────

export type ItemWithCompletion = KloChecklistItem & {
  completion: Pick<KloChecklistCompletion, 'id' | 'is_complete' | 'evidence_location'> | null
}

interface Props {
  items: ItemWithCompletion[]
  isViewer: boolean
  isDualReg: boolean
  kloItemId: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function RegBadge({ reg }: { reg: string | null }) {
  if (!reg) return null
  return (
    <span className="inline-block text-[10px] font-mono font-medium bg-fill-dim text-ink-dim rounded px-1.5 py-0.5 leading-none">
      {reg}
    </span>
  )
}

// ─── Specialist sub-service colour config ─────────────────────────────────────

const SPECIALIST_COLOURS: Record<string, {
  border: string; header: string; dot: string; badge: string
}> = {
  'Dementia':              { border: 'border-purple-200', header: 'text-purple-700', dot: 'bg-purple-400',  badge: 'bg-purple-100 text-purple-700' },
  'Autism':                { border: 'border-blue-200',   header: 'text-blue-700',   dot: 'bg-blue-400',    badge: 'bg-blue-100 text-blue-700' },
  'Learning Disabilities': { border: 'border-amber-200',  header: 'text-amber-700',  dot: 'bg-amber-400',   badge: 'bg-amber-100 text-amber-700' },
  'Mental Health':         { border: 'border-violet-200', header: 'text-violet-700', dot: 'bg-violet-400',  badge: 'bg-violet-100 text-violet-700' },
  'End of Life':           { border: 'border-rose-200',   header: 'text-rose-700',   dot: 'bg-rose-400',    badge: 'bg-rose-100 text-rose-700' },
  'Acquired Brain Injury': { border: 'border-sky-200',    header: 'text-sky-700',    dot: 'bg-sky-400',     badge: 'bg-sky-100 text-sky-700' },
  'Physical Disabilities': { border: 'border-emerald-200',header: 'text-emerald-700',dot: 'bg-emerald-400', badge: 'bg-emerald-100 text-emerald-700' },
  'Bariatric Care':        { border: 'border-orange-200', header: 'text-orange-700', dot: 'bg-orange-400',  badge: 'bg-orange-100 text-orange-700' },
  'Sensory Impairment':    { border: 'border-indigo-200', header: 'text-indigo-700', dot: 'bg-indigo-400',  badge: 'bg-indigo-100 text-indigo-700' },
  'Epilepsy':              { border: 'border-fuchsia-200',header: 'text-fuchsia-700',dot: 'bg-fuchsia-400', badge: 'bg-fuchsia-100 text-fuchsia-700' },
}

const SPECIALIST_SUB_SERVICES = [
  'Autism', 'Learning Disabilities', 'Mental Health', 'End of Life',
  'Acquired Brain Injury', 'Physical Disabilities', 'Bariatric Care',
  'Sensory Impairment', 'Epilepsy',
]

function RefBadge({ displayOrder, itemType, subService }: {
  displayOrder: number
  itemType: string
  subService: string | null
}) {
  const colours =
    itemType === 'Dementia Care' ? SPECIALIST_COLOURS['Dementia'] :
    subService && SPECIALIST_COLOURS[subService] ? SPECIALIST_COLOURS[subService] :
    null

  return (
    <span className={`
      inline-block text-[10px] font-mono font-medium rounded px-1.5 py-0.5 leading-none shrink-0
      ${colours ? colours.badge : 'bg-[#e6f7f5] text-brand'}
    `}>
      K{displayOrder}
    </span>
  )
}

// ─── Single item row ──────────────────────────────────────────────────────────

function ChecklistItemRow({
  item,
  isComplete,
  evidence,
  isViewer,
  onToggle,
  onSaveEvidence,
}: {
  item: KloChecklistItem
  isComplete: boolean
  evidence: string
  isViewer: boolean
  onToggle: (itemId: string, newState: boolean) => void
  onSaveEvidence: (itemId: string, evidence: string) => void
}) {
  const [localEvidence, setLocalEvidence] = useState(evidence)
  const [showEvidence, setShowEvidence]   = useState(!!evidence)
  const [saving, setSaving]               = useState(false)
  const [saved, setSaved]                 = useState(false)
  const inputRef                          = useRef<HTMLInputElement>(null)

  // Keep local evidence in sync if the prop changes (e.g. after server round-trip)
  const prevEvidence = useRef(evidence)
  if (prevEvidence.current !== evidence) {
    prevEvidence.current = evidence
    setLocalEvidence(evidence)
  }

  const isDirty = localEvidence !== evidence

  async function handleSaveEvidence() {
    setSaving(true)
    await onSaveEvidence(item.id, localEvidence)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className={`
      flex gap-3 py-3 px-4 rounded-lg transition-colors
      ${isComplete ? 'bg-green-50' : 'bg-card hover:bg-canvas'}
    `}>
      {/* Checkbox */}
      <div className="pt-0.5 shrink-0">
        <input
          type="checkbox"
          checked={isComplete}
          disabled={isViewer}
          onChange={e => {
            if (!isViewer) onToggle(item.id, e.target.checked)
          }}
          className="
            w-4 h-4 rounded border-line text-brand
            focus:ring-2 focus:ring-[#00b8a6] focus:ring-offset-1
            disabled:opacity-60 disabled:cursor-not-allowed
            cursor-pointer
          "
          aria-label={item.checklist_item}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Top row: ref + text */}
        <div className="flex flex-wrap items-start gap-2">
          <RefBadge displayOrder={item.display_order} itemType={item.item_type} subService={item.sub_service} />
          <p className={`text-sm flex-1 leading-snug ${isComplete ? 'line-through text-ink-dim' : 'text-ink'}`}>
            {item.checklist_item}
          </p>
        </div>

        {/* Evidence suggestion (collapsed by default) */}
        {item.evidence_notes && (
          <button
            type="button"
            onClick={() => setShowEvidence(v => !v)}
            className="inline-flex items-center gap-1 text-xs font-medium text-brand bg-[#e6f7f5] hover:bg-[#ccf0ec] rounded px-2 py-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#00b8a6]"
          >
            <span aria-hidden="true">{showEvidence ? '▲' : '▼'}</span>
            {showEvidence ? 'Hide evidence guide' : 'What evidence is needed?'}
          </button>
        )}
        {showEvidence && item.evidence_notes && (
          <p className="text-xs text-ink bg-[#f0faf9] border border-[#c0eae5] rounded px-3 py-2 leading-relaxed">
            {item.evidence_notes}
          </p>
        )}

        {/* Evidence location field */}
        {!isViewer && (
          <div className="flex gap-2 items-center mt-1">
            <input
              ref={inputRef}
              type="text"
              value={localEvidence}
              onChange={e => {
                setLocalEvidence(e.target.value)
                setSaved(false)
              }}
              placeholder="Evidence location"
              className="
                flex-1 text-xs rounded border border-line px-2 py-1.5
                bg-card text-ink placeholder:text-ink-dim
                focus:outline-none focus:ring-1 focus:ring-[#014D4E] focus:border-[#014D4E]
              "
            />
            {isDirty && (
              <button
                type="button"
                onClick={handleSaveEvidence}
                disabled={saving}
                className="
                  text-[11px] font-medium px-2.5 py-1.5 rounded
                  bg-[#014D4E] text-white
                  hover:bg-[#013838]
                  focus:outline-none focus:ring-1 focus:ring-[#014D4E]
                  disabled:opacity-50
                  transition-colors shrink-0
                "
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            )}
            {saved && !isDirty && (
              <span className="text-[11px] text-green-600 font-medium shrink-0">Saved ✓</span>
            )}
          </div>
        )}
        {isViewer && evidence && (
          <p className="text-[11px] text-ink-dim mt-1">
            <span className="font-medium">Evidence: </span>{evidence}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Group rendering ──────────────────────────────────────────────────────────

function ItemGroup({
  label,
  items,
  completionMap,
  evidenceMap,
  isViewer,
  onToggle,
  onSaveEvidence,
}: {
  label?: string
  items: KloChecklistItem[]
  completionMap: Map<string, boolean>
  evidenceMap: Map<string, string>
  isViewer: boolean
  onToggle: (itemId: string, newState: boolean) => void
  onSaveEvidence: (itemId: string, evidence: string) => void
}) {
  if (items.length === 0) return null
  return (
    <div>
      {label && (
        <p className="text-xs font-semibold text-ink-dim uppercase tracking-wide mb-2 px-4">{label}</p>
      )}
      <div className="space-y-1">
        {items.map(item => (
          <ChecklistItemRow
            key={item.id}
            item={item}
            isComplete={completionMap.get(item.id) ?? false}
            evidence={evidenceMap.get(item.id) ?? ''}
            isViewer={isViewer}
            onToggle={onToggle}
            onSaveEvidence={onSaveEvidence}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export default function ChecklistPanel({ items, isViewer, isDualReg, kloItemId }: Props) {
  const [isPending, startTransition] = useTransition()

  // Build optimistic completion map from props
  const initialMap = new Map<string, boolean>(
    items.map(i => [i.id, i.completion?.is_complete ?? false])
  )
  const [optimisticMap, setOptimistic] = useOptimistic(
    initialMap,
    (current: Map<string, boolean>, { id, value }: { id: string; value: boolean }) => {
      const next = new Map(current)
      next.set(id, value)
      return next
    }
  )

  // Evidence map (not optimistic — save is explicit)
  const evidenceMap = new Map<string, string>(
    items.map(i => [i.id, i.completion?.evidence_location ?? ''])
  )

  function handleToggle(itemId: string, newState: boolean) {
    startTransition(async () => {
      setOptimistic({ id: itemId, value: newState })
      const fd = new FormData()
      fd.set('checklist_item_id', itemId)
      fd.set('klo_item_id', kloItemId)
      fd.set('is_complete', String(newState))
      fd.set('evidence_location', evidenceMap.get(itemId) ?? '')
      await upsertChecklistCompletion(null, fd)
    })
  }

  async function handleSaveEvidence(itemId: string, evidence: string) {
    const fd = new FormData()
    fd.set('checklist_item_id', itemId)
    fd.set('klo_item_id', kloItemId)
    fd.set('is_complete', String(optimisticMap.get(itemId) ?? false))
    fd.set('evidence_location', evidence)
    await upsertChecklistCompletion(null, fd)
    // Update the evidenceMap so the "saved" state is reflected
    evidenceMap.set(itemId, evidence)
  }

  // Separate Dementia Care (legacy item_type) vs everything else
  const dementiaItems = items.filter(i => i.item_type === 'Dementia Care')

  // Core items: split true core from specialist sub-service items
  const allCoreItems    = items.filter(i => i.item_type === 'Core')
  const coreItems       = allCoreItems.filter(i => !i.sub_service || ['Residential', 'Nursing', 'Joint'].includes(i.sub_service ?? ''))
  const specialistItems = allCoreItems.filter(i => i.sub_service && SPECIALIST_SUB_SERVICES.includes(i.sub_service))

  // Group specialist items by sub_service (preserving display order)
  const specialistGroups = SPECIALIST_SUB_SERVICES
    .map(ss => ({ ss, items: specialistItems.filter(i => i.sub_service === ss) }))
    .filter(g => g.items.length > 0)

  // For Dual-Registered: further split Core by sub_service
  const resItems    = coreItems.filter(i => i.sub_service === 'Residential')
  const nurseItems  = coreItems.filter(i => i.sub_service === 'Nursing')
  const otherCore   = coreItems.filter(i => !i.sub_service)

  // Progress counters
  const totalItems    = items.length
  const completeCount = [...optimisticMap.values()].filter(Boolean).length

  if (items.length === 0) {
    return (
      <div className="text-sm text-ink-dim px-1">
        No compliance checklist items available for this KLOE and your service type.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-fill-dim rounded-full h-2 overflow-hidden">
          <div
            className="h-2 rounded-full bg-[#00b8a6] transition-all duration-300"
            style={{ width: `${totalItems > 0 ? (completeCount / totalItems) * 100 : 0}%` }}
          />
        </div>
        <span className="text-xs font-medium text-ink-dim shrink-0">
          {completeCount} / {totalItems} complete
        </span>
      </div>

      {/* Core items */}
      {coreItems.length > 0 && (
        <div className="space-y-2">
          {(dementiaItems.length > 0 || specialistGroups.length > 0) && (
            <p className="text-xs font-semibold text-brand uppercase tracking-wide">Core</p>
          )}
          <div className="rounded-xl border border-line overflow-hidden divide-y divide-gray-100">
            {isDualReg ? (
              <>
                {resItems.length > 0 && (
                  <ItemGroup
                    label="Residential wing"
                    items={resItems}
                    completionMap={optimisticMap}
                    evidenceMap={evidenceMap}
                    isViewer={isViewer}
                    onToggle={handleToggle}
                    onSaveEvidence={handleSaveEvidence}
                  />
                )}
                {nurseItems.length > 0 && (
                  <div className={resItems.length > 0 ? 'border-t border-dashed border-line pt-1' : ''}>
                    <ItemGroup
                      label="Nursing wing"
                      items={nurseItems}
                      completionMap={optimisticMap}
                      evidenceMap={evidenceMap}
                      isViewer={isViewer}
                      onToggle={handleToggle}
                      onSaveEvidence={handleSaveEvidence}
                    />
                  </div>
                )}
                {otherCore.length > 0 && (
                  <ItemGroup
                    items={otherCore}
                    completionMap={optimisticMap}
                    evidenceMap={evidenceMap}
                    isViewer={isViewer}
                    onToggle={handleToggle}
                    onSaveEvidence={handleSaveEvidence}
                  />
                )}
              </>
            ) : (
              <ItemGroup
                items={coreItems}
                completionMap={optimisticMap}
                evidenceMap={evidenceMap}
                isViewer={isViewer}
                onToggle={handleToggle}
                onSaveEvidence={handleSaveEvidence}
              />
            )}
          </div>
        </div>
      )}

      {/* Specialist sub-service sections (LD / MH / EOL / Autism) */}
      {specialistGroups.map(({ ss, items: ssItems }) => {
        const c = SPECIALIST_COLOURS[ss] ?? SPECIALIST_COLOURS['Autism']
        return (
          <div key={ss} className="space-y-2">
            <p className={`text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5 ${c.header}`}>
              <span className={`inline-block w-2 h-2 rounded-full ${c.dot}`} aria-hidden="true" />
              {ss}
            </p>
            <div className={`rounded-xl border overflow-hidden ${c.border}`}>
              <ItemGroup
                items={ssItems}
                completionMap={optimisticMap}
                evidenceMap={evidenceMap}
                isViewer={isViewer}
                onToggle={handleToggle}
                onSaveEvidence={handleSaveEvidence}
              />
            </div>
          </div>
        )
      })}

      {/* Dementia Care items */}
      {dementiaItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-purple-400" aria-hidden="true" />
            Dementia Care
          </p>
          <div className="rounded-xl border border-purple-200 overflow-hidden">
            <ItemGroup
              items={dementiaItems}
              completionMap={optimisticMap}
              evidenceMap={evidenceMap}
              isViewer={isViewer}
              onToggle={handleToggle}
              onSaveEvidence={handleSaveEvidence}
            />
          </div>
        </div>
      )}

      {isPending && (
        <p className="text-xs text-ink-dim animate-pulse">Saving…</p>
      )}
    </div>
  )
}
