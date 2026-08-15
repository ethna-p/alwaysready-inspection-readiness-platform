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

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://alwaysready.uk',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function GET(req: NextRequest) {
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
