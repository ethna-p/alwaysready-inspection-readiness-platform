/**
 * GET /api/export-evidence
 *
 * Downloads all evidence files uploaded by the organisation from Supabase
 * Storage and returns them as a single ZIP archive.
 *
 * ZIP structure:
 *   {KLOE title}/{original filename}
 *
 * The timestamp prefix added at upload time (e.g. "1721234567890-") is
 * stripped from filenames so the download is clean for the end user.
 *
 * Admin-only. Uses the service-role client to bypass storage RLS.
 */

import { NextResponse } from 'next/server'
import JSZip from 'jszip'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Allow up to 5 minutes on Vercel Pro for large evidence collections
export const maxDuration = 300

export async function GET() {
  // ── 1. Auth — admin only ──────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role, organisation_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin' || !profile.organisation_id) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 })
  }

  const orgId = profile.organisation_id
  const adminSupabase = createAdminClient()

  // ── 2. List KLOE folders under evidence/{orgId}/ ─────────────────────────
  const { data: folders, error: listError } = await adminSupabase.storage
    .from('evidence')
    .list(orgId)

  if (listError) {
    console.error('[export-evidence] Storage list error:', listError)
    return NextResponse.json({ error: 'Failed to access evidence storage.' }, { status: 500 })
  }

  if (!folders || folders.length === 0) {
    return NextResponse.json({ error: 'No evidence files have been uploaded yet.' }, { status: 404 })
  }

  // ── 3. Resolve KLOE titles for human-readable folder names ───────────────
  const kloItemIds = folders.map(f => f.name)

  const { data: kloItems } = await adminSupabase
    .from('klo_items')
    .select('id, title')
    .in('id', kloItemIds)

  const titleMap = new Map((kloItems ?? []).map(k => [k.id, k.title]))

  // ── 4. Download every file and add to ZIP ─────────────────────────────────
  const zip = new JSZip()
  let fileCount = 0

  for (const folder of folders) {
    const kloItemId = folder.name
    const kloTitle  = titleMap.get(kloItemId) ?? kloItemId

    // Sanitise for use as a ZIP folder name (strip chars that break paths)
    const safeFolder = kloTitle.replace(/[/\\:*?"<>|]/g, '_').trim()

    const { data: files, error: filesError } = await adminSupabase.storage
      .from('evidence')
      .list(`${orgId}/${kloItemId}`)

    if (filesError || !files || files.length === 0) continue

    for (const file of files) {
      const storagePath = `${orgId}/${kloItemId}/${file.name}`

      const { data: blob, error: downloadError } = await adminSupabase.storage
        .from('evidence')
        .download(storagePath)

      if (downloadError || !blob) {
        console.error(`[export-evidence] Failed to download ${storagePath}:`, downloadError)
        continue
      }

      // Strip the timestamp prefix (e.g. "1721234567890-") added at upload
      const cleanName = file.name.replace(/^\d+-/, '')

      zip.file(`${safeFolder}/${cleanName}`, await blob.arrayBuffer())
      fileCount++
    }
  }

  if (fileCount === 0) {
    return NextResponse.json({ error: 'No evidence files have been uploaded yet.' }, { status: 404 })
  }

  // ── 5. Stream ZIP response ────────────────────────────────────────────────
  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })

  return new NextResponse(zipBuffer as unknown as BodyInit, {
    headers: {
      'Content-Type':        'application/zip',
      'Content-Disposition': 'attachment; filename="evidence-files.zip"',
    },
  })
}
