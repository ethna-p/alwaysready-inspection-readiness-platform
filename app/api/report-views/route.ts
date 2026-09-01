/**
 * /api/report-views
 *
 * GET    — Returns system views + the org's custom views (all authenticated users)
 * POST   — Create a custom view for the org (admin only)
 * DELETE — Delete a custom view by id (admin only, cannot delete system views)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAAL2Satisfied } from '@/lib/session'
import type { ReportViewConfig, SavedReportView } from '@/lib/types'

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isAAL2Satisfied(supabase))) return NextResponse.json({ error: 'MFA verification required.' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('organisation_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organisation_id) {
    return NextResponse.json({ error: 'No organisation' }, { status: 400 })
  }

  // RLS handles the filter (system views + org views), but we order nicely:
  // system views first, then custom views newest-first
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await supabase
    .from('saved_report_views')
    .select('id, org_id, name, config, is_system, created_by, created_at')
    .order('is_system', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json((data ?? []) as unknown as SavedReportView[])
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isAAL2Satisfied(supabase))) return NextResponse.json({ error: 'MFA verification required.' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('organisation_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.organisation_id) {
    return NextResponse.json({ error: 'No organisation' }, { status: 400 })
  }
  if (profile.role !== 'admin') {
    return NextResponse.json({ error: 'Admin role required' }, { status: 403 })
  }

  const body = await req.json() as { name?: string; config?: ReportViewConfig }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }
  if (!body.config) {
    return NextResponse.json({ error: 'Config is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('saved_report_views')
    .insert({
      org_id:     profile.organisation_id,
      name:       body.name.trim(),
      config:     body.config as unknown as Record<string, unknown>,
      is_system:  false,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data as unknown as SavedReportView, { status: 201 })
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await isAAL2Satisfied(supabase))) return NextResponse.json({ error: 'MFA verification required.' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('organisation_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.organisation_id) {
    return NextResponse.json({ error: 'No organisation' }, { status: 400 })
  }
  if (profile.role !== 'admin') {
    return NextResponse.json({ error: 'Admin role required' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  // RLS policy prevents deleting system views or other orgs' views
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase
    .from('saved_report_views')
    .delete()
    .eq('id', id)
    .eq('is_system', false)
    .eq('org_id', profile.organisation_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return new NextResponse(null, { status: 204 })
}
