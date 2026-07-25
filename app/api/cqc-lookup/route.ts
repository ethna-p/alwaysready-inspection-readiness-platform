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

export async function GET(req: NextRequest) {
  const locationId = req.nextUrl.searchParams.get('locationId')?.trim()

  if (!locationId) {
    return NextResponse.json({ error: 'locationId is required' }, { status: 400 })
  }

  const result = await fetchCqcLocation(locationId)

  if (result.status === 'not_found') {
    return NextResponse.json({ found: false, unavailable: false }, { status: 200 })
  }

  if (result.status === 'unavailable') {
    return NextResponse.json({ found: false, unavailable: true }, { status: 200 })
  }

  return NextResponse.json({
    found:              true,
    locationName:       result.data.locationName,
    registrationStatus: result.data.registrationStatus,
    overallRating:      result.data.overallRating,
    lastInspectionDate: result.data.lastInspectionDate,
  })
}
