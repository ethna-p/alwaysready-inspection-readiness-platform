/**
 * GET /api/cqc-lookup?locationId=1-XXXXXXXXXX
 *
 * Lightweight public endpoint used by the trial signup form to validate
 * a CQC Location ID on blur. Returns the location name and current rating
 * so the form can show inline confirmation before the user submits.
 *
 * No authentication required — the CQC data returned is already public.
 * Rate-limited only by the CQC API's own upstream constraints.
 */
import { NextRequest, NextResponse } from 'next/server'
import { fetchCqcLocation } from '@/lib/cqc'

export async function GET(req: NextRequest) {
  const locationId = req.nextUrl.searchParams.get('locationId')?.trim()

  if (!locationId) {
    return NextResponse.json({ error: 'locationId is required' }, { status: 400 })
  }

  const data = await fetchCqcLocation(locationId)

  if (!data) {
    return NextResponse.json({ found: false }, { status: 200 })
  }

  return NextResponse.json({
    found:              true,
    locationName:       data.locationName,
    registrationStatus: data.registrationStatus,
    overallRating:      data.overallRating,
    lastInspectionDate: data.lastInspectionDate,
  })
}
