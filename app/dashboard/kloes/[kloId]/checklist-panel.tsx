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
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function RegBadge({ reg }: { reg: string | null }) {
  if (!reg) return null
  return (
    <span className="inline-block text-[10px] font-mono font-medium bg-gray-100 text-gray-600 rounded px-1.5 py-0.5 leading-none">
      {reg}
    </span>
  )
}

function RefBadge({ ref: itemRef, itemType }: { ref: string; itemType: string }) {
  const isDementia = itemType === 'Dementia Care'
  return (
    <span className={`
      inline-block text-[10px] font-mono font-medium rounded px-1.5 py-0.5 leading-none shrink-0
      ${isDementia
        ? 'bg-purple-100 text-purple-700'
        : 'bg-[#e6f7f5] text-[#014D4E]'
      }
    `}>
      {itemRef}
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
      ${isComplete ? 'bg-green-50' : 'bg-white hover:bg-[#faf9f6]'}
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
            w-4 h-4 rounded border-gray-300 text-[#014D4E]
            focus:ring-2 focus:ring-[#00b8a6] focus:ring-offset-1
            disabled:opacity-60 disabled:cursor-not-allowed
            cursor-pointer
          "
          aria-label={item.checklist_item}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Top row: ref + text + regulation */}
        <div className="flex flex-wrap items-start gap-2">
          <RefBadge ref={item.ref} itemType={item.item_type} />
          <p className={`text-sm flex-1 leading-snug ${isComplete ? 'line-through text-gray-600' : 'text-[#1a1a1a]'}`}>
            {item.checklist_item}
          </p>
          <RegBadge reg={item.regulation} />
        </div>

        {/* Evidence suggestion (collapsed by default) */}
        {item.evidence_notes && (
          <button
            type="button"
            onClick={() => setShowEvidence(v => !v)}
            className="text-[11px] text-[#014D4E] hover:underline focus:outline-none focus:ring-1 focus:ring-[#00b8a6] rounded"
          >
            {showEvidence ? 'Hide evidence hint' : 'What evidence is needed?'}
          </button>
        )}
        {showEvidence && item.evidence_notes && (
          <p className="text-[11px] text-gray-600 bg-gray-50 rounded px-2 py-1.5 leading-relaxed">
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
              placeholder="Evidence location (optional)"
              className="
                flex-1 text-xs rounded border border-gray-200 px-2 py-1.5
                bg-white text-[#1a1a1a] placeholder:text-gray-600
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
          <p className="text-[11px] text-gray-600 mt-1">
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
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 px-4">{label}</p>
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

export default function ChecklistPanel({ items, isViewer, isDualReg }: Props) {
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
      fd.set('is_complete', String(newState))
      fd.set('evidence_location', evidenceMap.get(itemId) ?? '')
      await upsertChecklistCompletion(null, fd)
    })
  }

  async function handleSaveEvidence(itemId: string, evidence: string) {
    const fd = new FormData()
    fd.set('checklist_item_id', itemId)
    fd.set('is_complete', String(optimisticMap.get(itemId) ?? false))
    fd.set('evidence_location', evidence)
    await upsertChecklistCompletion(null, fd)
    // Update the evidenceMap so the "saved" state is reflected
    evidenceMap.set(itemId, evidence)
  }

  // Separate Core vs Dementia Care
  const coreItems     = items.filter(i => i.item_type === 'Core')
  const dementiaItems = items.filter(i => i.item_type === 'Dementia Care')

  // For Dual-Registered: further split Core by sub_service
  const resItems    = coreItems.filter(i => i.sub_service === 'Residential')
  const nurseItems  = coreItems.filter(i => i.sub_service === 'Nursing')
  const otherCore   = coreItems.filter(i => !i.sub_service)

  // Progress counters
  const totalItems    = items.length
  const completeCount = [...optimisticMap.values()].filter(Boolean).length

  if (items.length === 0) {
    return (
      <div className="text-sm text-gray-600 px-1">
        No compliance checklist items available for this KLOE and your service type.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="h-2 rounded-full bg-[#00b8a6] transition-all duration-300"
            style={{ width: `${totalItems > 0 ? (completeCount / totalItems) * 100 : 0}%` }}
          />
        </div>
        <span className="text-xs font-medium text-gray-600 shrink-0">
          {completeCount} / {totalItems} complete
        </span>
      </div>

      {/* Core items */}
      {coreItems.length > 0 && (
        <div className="space-y-2">
          {dementiaItems.length > 0 && (
            <p className="text-xs font-semibold text-[#014D4E] uppercase tracking-wide">Core</p>
          )}
          <div className="rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
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
                  <div className={resItems.length > 0 ? 'border-t border-dashed border-gray-200 pt-1' : ''}>
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
        <p className="text-xs text-gray-600 animate-pulse">Saving…</p>
      )}
    </div>
  )
}
