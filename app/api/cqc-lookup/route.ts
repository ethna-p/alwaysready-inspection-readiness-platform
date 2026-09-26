/**
 * GET /api/cqc-lookup?locationId=1-XXXXXXXXXX
 *
 * Lightweight public endpoint used by the trial signup form to validate
 * a CQC Location ID on blur. Returns the location name and current rating
 * so the form can show inline confirmation before the user submits.
 *
 * Response shapes:
 *   { found: true,  locationName, registrationStatus, overallRating, lastInspectionDate }
 *   { found: false, unavailable: false }  — 404 from CQC
 *   { found: false, unavailable: true  }  — CQC API is temporarily unreachable
 *
 * No authentication required — the CQC data returned is already public.
 */
import { NextRequest, NextResponse } from 'next/server'
import { fetchCqcLocation } from '@/lib/cqc'
import { createRateLimiter, getClientIp } from '@/lib/rate-limit'

// Sites allowed to call this endpoint from a browser: the live marketing site
// and its Cloudflare Pages preview, so form changes can be tested before launch.
const ALLOWED_ORIGINS = [
  'https://alwaysready.uk',
  'https://preview.alwaysready-marketing.pages.dev',
]

function corsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get('origin') ?? ''
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  }
}

// 60 lookups per 10 minutes per IP — allows repeated onBlur validation
// without being exploitable as a CQC API proxy
const limiter = createRateLimiter({ name: 'cqc-lookup', windowMs: 10 * 60_000, max: 60 })

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) })
}

export async function GET(req: NextRequest) {
  const CORS_HEADERS = corsHeaders(req)
  if (!await limiter.check(getClientIp(req))) {
    return new NextResponse('Too many requests. Please try again later.', {
      status: 429,
      headers: { ...CORS_HEADERS, 'Content-Type': 'text/plain', 'Retry-After': '600' },
    })
  }

  const locationId = req.nextUrl.searchParams.get('locationId')?.trim()

  if (!locationId) {
    return NextResponse.json({ error: 'locationId is required' }, { status: 400, headers: CORS_HEADERS })
  }

  const result = await fetchCqcLocation(locationId)

  if (result.status === 'not_found') {
    return NextResponse.json({ found: false, unavailable: false }, { status: 200, headers: CORS_HEADERS })
  }

  if (result.status === 'unavailable') {
    return NextResponse.json({ found: false, unavailable: true }, { status: 200, headers: CORS_HEADERS })
  }

  return NextResponse.json({
    found:              true,
    locationName:       result.data.locationName,
    registrationStatus: result.data.registrationStatus,
    overallRating:      result.data.overallRating,
    lastInspectionDate: result.data.lastInspectionDate,
  }, { headers: CORS_HEADERS })
}
