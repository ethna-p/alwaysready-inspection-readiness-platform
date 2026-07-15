/**
 * /dashboard/inspection-pack — Exportable Inspection Readiness Pack (Step 9)
 *
 * A print-optimised summary that an RCM can hand to an inspector or board
 * member. Uses the browser's built-in print-to-PDF — no PDF library needed.
 *
 * On screen:  breadcrumb + Print button + report preview
 * When printed: just the report (nav, header, footer, button hidden via CSS)
 *
 * Data sources: same tables as the Readiness Dashboard + Daily Report.
 * No new tables.
 */
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { calculateRAG, RAG_LABELS, type RAGStatus } from '@/lib/rag'
import type { ComplianceRecord } from '@/lib/types'
import PrintButton from './print-button'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function isCompliant(record: ComplianceRecord | null | undefined, now: Date): boolean {
  if (!record) return false
  return (
    record.status === 'completed' &&
    record.next_review_due !== null &&
    new Date(record.next_review_due) >= now
  )
}

function pctColour(pct: number): string {
  if (pct >= 80) return '#15803d' // green-700
  if (pct >= 50) return '#b45309' // amber-700
  return '#b91c1c'                // red-700
}

function kloCode(kqName: string, displayOrder: number): string {
  return `${kqName.charAt(0).toUpperCase()}${displayOrder}`
}

/** Status text without a coloured background (reliable in print) */
function statusLabel(status: string | null): string {
  if (status === 'completed')  return 'Completed'
  if (status === 'in_progress') return 'In Progress'
  return 'Not Started'
}

/** Coloured dot character + label for print-safe RAG display */
function RagCell({ status }: { status: RAGStatus }) {
  const colours: Record<RAGStatus, string> = {
    grey:  '#9ca3af',
    red:   '#dc2626',
    amber: '#d97706',
    green: '#16a34a',
  }
  return (
    <span style={{ color: colours[status] }} className="font-medium whitespace-nowrap">
      ● {RAG_LABELS[status]}
    </span>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function InspectionPackPage() {
  const supabase = await createClient()

  // Auth
  const { data: { user } } = await supabase.auth.getUser()

  // Organisation name (two-step — safest given RLS on organisations)
  const { data: userRow } = await supabase
    .from('users')
    .select('organisation_id')
    .eq('id', user!.id)
    .single()

  const { data: orgRow } = await supabase
    .from('organisations')
    .select('name')
    .eq('id', userRow?.organisation_id ?? '')
    .single()

  const orgName = orgRow?.name ?? 'Your Organisation'

  // Core data
  const [{ data: keyQuestions }, { data: kloItems }, { data: records }] =
    await Promise.all([
      supabase.from('key_questions').select('id, name').order('display_order'),
      supabase.from('klo_items').select('id, title, key_question_id, display_order').order('display_order'),
      supabase.from('compliance_records').select('*'),
    ])

  const now = new Date()
  const generatedDate = formatDate(now.toISOString())

  const recordByKloId = new Map<string, ComplianceRecord>(
    (records ?? []).map(r => [r.klo_item_id, r])
  )

  // Per-key-question aggregates
  type KqSummary = {
    id: string
    name: string
    klos: { id: string; title: string; displayOrder: number }[]
    compliant: number
    total: number
    pct: number
  }

  const kqSummaries: KqSummary[] = (keyQuestions ?? []).map(kq => {
    const klos = (kloItems ?? [])
      .filter(k => k.key_question_id === kq.id)
      .map(k => ({ id: k.id, title: k.title, displayOrder: k.display_order }))
    const compliant = klos.filter(k => isCompliant(recordByKloId.get(k.id), now)).length
    return {
      id: kq.id,
      name: kq.name,
      klos,
      compliant,
      total: klos.length,
      pct: klos.length > 0 ? Math.round((compliant / klos.length) * 100) : 0,
    }
  })

  const totalKlos = kqSummaries.reduce((a, b) => a + b.total, 0)
  const totalCompliant = kqSummaries.reduce((a, b) => a + b.compliant, 0)
  const overallPct = totalKlos > 0 ? Math.round((totalCompliant / totalKlos) * 100) : 0

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Print-specific CSS — hoisted to <head> by React */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4 portrait; margin: 15mm 15mm 20mm 15mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}} />

      {/* ── Screen-only controls ─────────────────────────────────────────── */}
      <div className="print:hidden">
        <nav className="text-sm text-gray-500 mb-2" aria-label="Breadcrumb">
          <ol className="flex gap-1">
            <li>
              <Link href="/dashboard" className="hover:text-[#014D4E] underline">
                Dashboard
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-[#1a1a1a]" aria-current="page">
              Inspection Pack
            </li>
          </ol>
        </nav>

        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#014D4E]">Inspection Pack</h1>
            <p className="text-sm text-gray-500 mt-1">
              A printable snapshot of your current readiness — ready to share
              with an inspector or board member.
            </p>
          </div>
          <PrintButton />
        </div>

        <p className="text-xs text-gray-400 mb-6 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
          Click <strong className="text-gray-600">Print / Save as PDF</strong> above, then choose{' '}
          <strong className="text-gray-600">Save as PDF</strong> in your browser's print dialog.
          The navigation and this message will not appear in the output.
        </p>
      </div>

      {/* ── Report (visible on screen and in print) ──────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 print:border-0 print:rounded-none print:p-0 print:shadow-none">

        {/* Print-only header — hidden on screen */}
        <div className="hidden print:flex print:items-start print:justify-between print:mb-8 print:pb-6 print:border-b-2 print:border-[#014D4E]">
          <div>
            <p className="text-xs font-bold text-[#014D4E] uppercase tracking-widest mb-1">
              AlwaysReady
            </p>
            <h1 className="text-2xl font-bold text-[#1a1a1a]">
              CQC Inspection Readiness Pack
            </h1>
            <p className="text-base font-semibold text-[#014D4E] mt-1">{orgName}</p>
          </div>
          <div className="text-right text-xs text-gray-500">
            <p>Prepared: {generatedDate}</p>
            <p className="mt-1">alwaysready.co.uk</p>
          </div>
        </div>

        {/* Screen header (hidden when printing) */}
        <div className="print:hidden mb-8 pb-6 border-b border-gray-200">
          <p className="text-xs font-semibold text-[#00b8a6] uppercase tracking-widest mb-1">
            {orgName}
          </p>
          <h2 className="text-xl font-bold text-[#014D4E]">
            CQC Inspection Readiness Pack
          </h2>
          <p className="text-sm text-gray-500 mt-1">Prepared: {generatedDate}</p>
        </div>

        {/* ── Overall readiness ─────────────────────────────────────────── */}
        <section aria-labelledby="overall-heading" className="mb-8">
          <div className="flex flex-wrap items-center gap-8">
            {/* Big % */}
            <div className="text-center">
              <div
                className="text-6xl font-bold leading-none"
                style={{ color: pctColour(overallPct) }}
                aria-label={`Overall readiness ${overallPct} percent`}
              >
                {overallPct}%
              </div>
              <div className="text-xs text-gray-500 mt-2 uppercase tracking-wide font-medium">
                Overall readiness
              </div>
            </div>

            {/* Progress bar */}
            <div className="flex-1 min-w-[200px]">
              <div
                className="w-full bg-gray-100 rounded-full h-4 overflow-hidden"
                role="progressbar"
                aria-valuenow={overallPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${overallPct}% of KLOEs are up to date`}
              >
                <div
                  className="h-4 rounded-full transition-all"
                  style={{
                    width: `${overallPct}%`,
                    backgroundColor: pctColour(overallPct),
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {totalCompliant} of {totalKlos} KLOEs currently up to date
              </p>
            </div>
          </div>
        </section>

        {/* ── Summary by key question ───────────────────────────────────── */}
        <section aria-labelledby="summary-heading" className="mb-8">
          <h2
            id="summary-heading"
            className="text-xs font-bold text-[#014D4E] uppercase tracking-widest mb-3"
          >
            Summary by Key Question
          </h2>

          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden print:border print:border-gray-300">
            <thead>
              <tr className="bg-[#014D4E] text-white">
                <th scope="col" className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wide">
                  Key Question
                </th>
                <th scope="col" className="text-center px-4 py-2.5 font-semibold text-xs uppercase tracking-wide">
                  Ready
                </th>
                <th scope="col" className="text-center px-4 py-2.5 font-semibold text-xs uppercase tracking-wide">
                  Total
                </th>
                <th scope="col" className="text-center px-4 py-2.5 font-semibold text-xs uppercase tracking-wide">
                  %
                </th>
                <th scope="col" className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wide">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {kqSummaries.map(kq => (
                <tr key={kq.id} className="hover:bg-gray-50 print:hover:bg-transparent">
                  <td className="px-4 py-2.5 font-medium text-[#1a1a1a]">{kq.name}</td>
                  <td className="px-4 py-2.5 text-center tabular-nums">{kq.compliant}</td>
                  <td className="px-4 py-2.5 text-center tabular-nums text-gray-500">{kq.total}</td>
                  <td
                    className="px-4 py-2.5 text-center font-bold tabular-nums"
                    style={{ color: pctColour(kq.pct) }}
                  >
                    {kq.pct}%
                  </td>
                  <td className="px-4 py-2.5">
                    <div
                      className="w-full bg-gray-100 rounded-full h-2"
                      role="presentation"
                    >
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${kq.pct}%`,
                          backgroundColor: pctColour(kq.pct),
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* ── Full KLOE detail — one section per key question ───────────── */}
        <div>
          <h2 className="text-xs font-bold text-[#014D4E] uppercase tracking-widest mb-4">
            Full KLOE Detail
          </h2>

          {kqSummaries.map((kq, kqIndex) => (
            <section
              key={kq.id}
              aria-labelledby={`kq-${kq.id}-heading`}
              className={kqIndex > 0 ? 'mt-8 print:break-before-page' : 'mt-0'}
            >
              {/* Key question heading */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-[#014D4E]">
                <h3
                  id={`kq-${kq.id}-heading`}
                  className="font-bold text-[#014D4E] text-base"
                >
                  {kq.name}
                </h3>
                <span
                  className="text-sm font-bold"
                  style={{ color: pctColour(kq.pct) }}
                >
                  {kq.pct}% ready ({kq.compliant}/{kq.total})
                </span>
              </div>

              {/* KLOE table */}
              <table className="w-full text-xs border border-gray-200 print:border-gray-300">
                <thead>
                  <tr className="bg-gray-50 print:bg-gray-100 border-b border-gray-200">
                    <th scope="col" className="text-left px-3 py-2 font-semibold text-gray-600 w-12">
                      Code
                    </th>
                    <th scope="col" className="text-left px-3 py-2 font-semibold text-gray-600">
                      KLOE
                    </th>
                    <th scope="col" className="text-left px-3 py-2 font-semibold text-gray-600 w-24">
                      Status
                    </th>
                    <th scope="col" className="text-left px-3 py-2 font-semibold text-gray-600 w-24">
                      RAG
                    </th>
                    <th scope="col" className="text-center px-3 py-2 font-semibold text-gray-600 w-16">
                      Priority
                    </th>
                    <th scope="col" className="text-left px-3 py-2 font-semibold text-gray-600 w-24 hidden sm:table-cell print:table-cell">
                      Last Review
                    </th>
                    <th scope="col" className="text-left px-3 py-2 font-semibold text-gray-600 w-24 hidden sm:table-cell print:table-cell">
                      Next Due
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {kq.klos.map(klo => {
                    const record = recordByKloId.get(klo.id)
                    const rag = calculateRAG(record, now)
                    const compliant = isCompliant(record, now)
                    const code = kloCode(kq.name, klo.displayOrder)

                    return (
                      <>
                        <tr
                          key={klo.id}
                          className={compliant ? 'bg-green-50 print:bg-transparent' : ''}
                        >
                          <td className="px-3 py-2.5 font-bold text-[#014D4E] align-top">
                            {code}
                          </td>
                          <td className="px-3 py-2.5 font-medium text-[#1a1a1a] align-top">
                            {klo.title}
                          </td>
                          <td className="px-3 py-2.5 text-gray-700 align-top">
                            {statusLabel(record?.status ?? null)}
                          </td>
                          <td className="px-3 py-2.5 align-top">
                            <RagCell status={rag} />
                          </td>
                          <td className="px-3 py-2.5 text-center align-top font-semibold text-[#014D4E]">
                            {record?.priority ?? '—'}
                          </td>
                          <td className="px-3 py-2.5 text-gray-600 align-top hidden sm:table-cell print:table-cell">
                            {formatDateShort(record?.date_reviewed)}
                          </td>
                          <td
                            className={`px-3 py-2.5 align-top hidden sm:table-cell print:table-cell font-medium ${
                              rag === 'red' ? 'text-red-700' : 'text-gray-600'
                            }`}
                          >
                            {formatDateShort(record?.next_review_due)}
                          </td>
                        </tr>
                        {/* Evidence location sub-row — only if present */}
                        {record?.evidence_location && (
                          <tr
                            key={`${klo.id}-evidence`}
                            className={`border-t-0 ${compliant ? 'bg-green-50 print:bg-transparent' : ''}`}
                          >
                            <td />
                            <td
                              colSpan={6}
                              className="px-3 pb-2.5 text-gray-500 text-xs italic"
                            >
                              Evidence: {record.evidence_location}
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </section>
          ))}
        </div>

        {/* ── Print footer — disclaimer (hidden on screen; SiteFooter covers it) */}
        <div className="hidden print:block mt-10 pt-6 border-t border-gray-200 text-xs text-gray-500 space-y-1">
          <p>
            © 2026 AlwaysReady is a brand of Parker Digital &amp; Print Services Ltd. |
            Registered Office: 82A James Carter Road, Mildenhall, IP28 7DE
          </p>
          <p>
            Our tools are designed to support providers in preparing for CQC inspection.
            They do not constitute official CQC guidance and do not guarantee any
            particular inspection outcome.
          </p>
        </div>

      </div>
    </>
  )
}
