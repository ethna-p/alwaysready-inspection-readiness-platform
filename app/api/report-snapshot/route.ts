/**
 * /api/report-snapshot
 *
 * GET  ?view_key=governance
 *   Returns the most recent snapshot for this org + view that is from a
 *   previous calendar day (UTC). Returns null if this is the first run.
 *
 * POST { view_key, green, amber, red, grey, total, open_actions, overdue_actions }
 *   Upserts today's snapshot (one per org per view per UTC day).
 *
 * Admin only.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/session'

interface SnapshotRow {
  id:              string
  view_key:        string
  green:           number
  amber:           number
  red:             number
  grey:            number
  total:           number
  open_actions:    number
  overdue_actions: number
  captured_at:     string
}

async function guardAdmin() {
  const profile = await getCurrentUserProfile()
  if (profile?.role !== 'admin') return null
  return profile
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const profile = await guardAdmin()
  if (!profile) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const viewKey = req.nextUrl.searchParams.get('view_key')
  if (!viewKey) return NextResponse.json({ error: 'view_key required' }, { status: 400 })

  const supabase = await createClient()

  // Today in UTC (YYYY-MM-DD)
  const todayUtc = new Date().toISOString().slice(0, 10)

  // Most recent snapshot strictly before today
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('report_snapshots')
    .select('id, view_key, green, amber, red, grey, total, open_actions, overdue_actions, captured_at')
    .eq('organisation_id', profile.organisation_id)
    .eq('view_key', viewKey)
    .lt('captured_at', todayUtc)          // strictly before midnight UTC today
    .order('captured_at', { ascending: false })
    .limit(1)
    .maybeSingle() as { data: SnapshotRow | null; error: unknown }

  if (error) {
    console.error('[report-snapshot] GET error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json({ snapshot: data })
}

// ── POST ──────────────────────────────────────────────────────────────────────

interface SnapshotPayload {
  view_key:        string
  green:           number
  amber:           number
  red:             number
  grey:            number
  total:           number
  open_actions:    number
  overdue_actions: number
}

export async function POST(req: NextRequest) {
  const profile = await guardAdmin()
  if (!profile) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: SnapshotPayload
  try {
    body = await req.json() as SnapshotPayload
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const supabase = await createClient()

  // Upsert: if a row already exists for (org, view_key, today), update it
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('report_snapshots')
    .upsert(
      {
        organisation_id: profile.organisation_id,
        view_key:        body.view_key,
        green:           body.green,
        amber:           body.amber,
        red:             body.red,
        grey:            body.grey,
        total:           body.total,
        open_actions:    body.open_actions,
        overdue_actions: body.overdue_actions,
        captured_at:     new Date().toISOString(),
      },
      { onConflict: 'organisation_id,view_key,date(captured_at)' }
    )

  if (error) {
    console.error('[report-snapshot] POST error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
