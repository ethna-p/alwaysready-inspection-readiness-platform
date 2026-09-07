/**
 * POST /api/upload-evidence
 *
 * Secure file upload pipeline:
 *   1. Authenticate the request (Supabase session cookie)
 *   2. Validate file size and MIME type via magic-byte inspection (file-type)
 *   3. Scan for malware via Cloudmersive Virus Scan API
 *   4. Upload clean file to Supabase Storage using service role key
 *   5. Return the storage path for the client to save as a metadata record
 *
 * By routing through this endpoint we ensure file bytes are never stored
 * without passing our validation and scanning checks — the client never
 * uploads directly to Supabase Storage.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAAL2Satisfied } from '@/lib/session'
import { MAX_SIZE_BYTES, validateFileMime, scanWithCloudmersive } from '@/lib/utils/upload'


export async function POST(request: NextRequest) {
  // ── 1. Authenticate ───────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }
  if (!(await isAAL2Satisfied(supabase))) {
    return NextResponse.json({ error: 'MFA verification required.' }, { status: 401 })
  }

  // Get profile to check role and org
  const { data: profile } = await supabase
    .from('users')
    .select('id, role, organisation_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'user'].includes(profile.role)) {
    return NextResponse.json({ error: 'You do not have permission to upload files.' }, { status: 403 })
  }

  // ── 2. Parse multipart form ───────────────────────────────────────────────
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  const kloItemId = formData.get('kloItemId') as string | null

  if (!file || !kloItemId) {
    return NextResponse.json({ error: 'Missing file or KLOE ID.' }, { status: 400 })
  }

  // ── 3. Size check ─────────────────────────────────────────────────────────
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'File is too large. Maximum size is 10 MB.' }, { status: 400 })
  }

  // ── 4. MIME validation via magic bytes ────────────────────────────────────
  const buffer = Buffer.from(await file.arrayBuffer())
  const mimeResult = await validateFileMime(buffer, file.name)
  if (!mimeResult.ok) {
    return NextResponse.json({ error: mimeResult.error }, { status: 400 })
  }
  const actualMime = mimeResult.actualMime
  // ── 5. Virus scan ─────────────────────────────────────────────────────────
  const scan = await scanWithCloudmersive(buffer, file.name, '[upload-evidence]')
  if (!scan.clean) {
    console.warn(`[upload-evidence] Virus detected in upload by user ${user.id}: ${file.name}`)
    return NextResponse.json({ error: (!scan.clean && scan.message) || 'File rejected.' }, { status: 400 })
  }

  // ── 6. Per-org quota check ────────────────────────────────────────────────
  const adminSupabase = createAdminClient()
  const { data: usageRows, error: quotaError } = await adminSupabase
    .rpc('get_org_upload_usage', { p_org_id: profile.organisation_id })
  const usage = usageRows?.[0] ?? null

  if (quotaError || !usage) {
    console.error('[upload-evidence] Quota check failed:', quotaError)
    return NextResponse.json({ error: 'Upload check failed. Please try again.' }, { status: 500 })
  }
  if (usage.at_file_limit) {
    return NextResponse.json(
      { error: 'Your organisation has reached the maximum number of uploaded files (500). Please delete some files before uploading more.' },
      { status: 400 }
    )
  }
  if (usage.at_byte_limit) {
    return NextResponse.json(
      { error: 'Your organisation has reached the storage limit (500 MB). Please delete some files before uploading more.' },
      { status: 400 }
    )
  }

  // ── 7. Upload to Supabase Storage (service role — bypasses storage RLS) ──
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `${profile.organisation_id}/${kloItemId}/${Date.now()}-${safeName}`

  const { error: uploadError } = await adminSupabase.storage
    .from('evidence')
    .upload(storagePath, new Uint8Array(buffer), {
      contentType: actualMime,
      upsert: false,
    })

  if (uploadError) {
    console.error('[upload-evidence] Storage upload error:', uploadError)
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({
    storagePath,
    fileName: file.name,
    fileSize: file.size,
    mimeType: actualMime,
    scanStatus: 'clean',
  })
}
