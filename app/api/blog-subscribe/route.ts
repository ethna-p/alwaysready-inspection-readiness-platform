/**
 * POST /api/blog-subscribe
 *
 * Public webhook called by the alwaysready.uk marketing website when
 * someone signs up for blog updates. Stores the subscriber in blog_subscribers.
 *
 * Expected body: { email: string, name?: string }
 * Returns:       { success: true } | { error: string }
 *
 * CORS: allows requests from www.alwaysready.uk (and plain alwaysready.uk).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ALLOWED_ORIGINS = [
  'https://www.alwaysready.uk',
  'https://alwaysready.uk',
]

function corsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

// Handle CORS preflight
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin')
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) })
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin')
  const headers = corsHeaders(origin)

  let body: { email?: unknown; name?: unknown }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400, headers })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : null
  const name  = typeof body.name  === 'string' ? body.name.trim()              : null

  // Basic email validation
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400, headers })
  }

  try {
    const supabase = createAdminClient()

    // Upsert: if they re-subscribe after unsubscribing, clear unsubscribed_at
    const { error } = await supabase
      .from('blog_subscribers')
      .upsert(
        {
          email,
          full_name: name ?? null,
          source: 'website_form',
          subscribed_at: new Date().toISOString(),
          unsubscribed_at: null,
        },
        { onConflict: 'email' },
      )

    if (error) {
      console.error('[blog-subscribe] Supabase error:', error)
      return NextResponse.json({ error: 'Could not save your subscription.' }, { status: 500, headers })
    }

    return NextResponse.json({ success: true }, { status: 200, headers })
  } catch (err) {
    console.error('[blog-subscribe] unexpected error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500, headers })
  }
}
