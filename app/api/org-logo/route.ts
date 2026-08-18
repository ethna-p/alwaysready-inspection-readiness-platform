/**
 * /api/org-logo
 *
 * POST — upload an org logo (multipart form data, field "logo")
 * DELETE — remove the org logo
 *
 * Admin only. Image is stored in the org-logos Supabase Storage bucket
 * at `{org_id}/logo.{ext}` and the public URL is saved to organisations.logo_url.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUserProfile } from '@/lib/session'

const BUCKET = 'org-logos'
const MAX_BYTES = 2 * 1024 * 1024 // 2 MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']

function extFor(mime: string): string {
  const map: Record<string, string> = {
    'image/png':     'png',
    'image/jpeg':    'jpg',
    'image/webp':    'webp',
    'image/gif':     'gif',
    'image/svg+xml': 'svg',
  }
  return map[mime] ?? 'png'
}

export async function POST(req: NextRequest) {
  const profile = await getCurrentUserProfile()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const orgId = profile.organisation_id
  const supabase = createAdminClient()

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('logo')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No logo file provided' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'File type not allowed. Use PNG, JPG, WebP, GIF, or SVG.' }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large. Maximum size is 2 MB.' }, { status: 400 })
  }

  const ext      = extFor(file.type)
  const path     = `${orgId}/logo.${ext}`
  const bytes    = await file.arrayBuffer()

  // Upsert (upload, overwriting any existing logo for this org)
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: true })

  if (uploadError) {
    console.error('[org-logo] upload error:', uploadError)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)

  // Add cache-bust so Next.js img doesn't serve a stale version
  const logoUrl = `${publicUrl}?v=${Date.now()}`

  // Save to organisations table (logo_url not yet in generated types — migration pending)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: dbError } = await (supabase as any)
    .from('organisations')
    .update({ logo_url: logoUrl })
    .eq('id', orgId)

  if (dbError) {
    console.error('[org-logo] db error:', dbError)
    return NextResponse.json({ error: 'Failed to save logo URL' }, { status: 500 })
  }

  return NextResponse.json({ logoUrl })
}

export async function DELETE() {
  const profile = await getCurrentUserProfile()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const orgId   = profile.organisation_id
  const supabase = createAdminClient()

  // Remove all logo files for this org (handles any extension)
  const { data: files } = await supabase.storage.from(BUCKET).list(orgId)
  if (files && files.length > 0) {
    const paths = files.map(f => `${orgId}/${f.name}`)
    await supabase.storage.from(BUCKET).remove(paths)
  }

  // Clear URL in DB
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('organisations')
    .update({ logo_url: null })
    .eq('id', orgId)

  return NextResponse.json({ ok: true })
}
