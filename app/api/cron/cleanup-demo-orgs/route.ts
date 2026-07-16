/**
 * GET /api/cron/cleanup-demo-orgs
 *
 * Called nightly by Vercel Cron (see vercel.json).
 * Deletes all demo organisations whose demo_expires_at has passed,
 * cascading to all their users, KLOEs, and compliance records.
 *
 * Protected by CRON_SECRET — Vercel sends this automatically as the
 * Authorization header. Requests without a valid secret are rejected.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization')
  const expectedSecret = process.env.CRON_SECRET

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const admin = createAdminClient()

    // Call the existing cleanup function in Supabase
    const { error } = await admin.rpc('cleanup_expired_demo_orgs' as never)

    if (error) {
      console.error('[cron] cleanup_expired_demo_orgs failed:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('[cron] cleanup_expired_demo_orgs completed successfully')
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[cron] Unexpected error:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
