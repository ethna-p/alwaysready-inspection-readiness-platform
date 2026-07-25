/**
 * CQC Syndication API client
 *
 * Wraps the CQC public REST API (https://api.cqc.org.uk/public/v1).
 * No authentication required — the partnerCode param is for attribution only.
 *
 * All functions fail gracefully: if the API is unavailable or returns an
 * unexpected response, they return null rather than throwing, so callers can
 * degrade gracefully without blocking the user.
 *
 * CQC overall ratings: Outstanding | Good | Requires improvement | Inadequate
 * Docs: https://api-portal.service.cqc.org.uk
 */

const CQC_API_BASE  = 'https://api.cqc.org.uk/public/v1'
const PARTNER_CODE  = 'alwaysready'
const FETCH_TIMEOUT = 8_000  // 8 s — generous for an external API

// ── Types ─────────────────────────────────────────────────────────────────────

export type CqcRating =
  | 'Outstanding'
  | 'Good'
  | 'Requires improvement'
  | 'Inadequate'

export type CqcLocationData = {
  locationId:          string
  locationName:        string
  registrationStatus:  string           // 'Registered' | 'Deregistered' | …
  overallRating:       CqcRating | null // null = not yet rated
  lastInspectionDate:  string | null    // ISO date string YYYY-MM-DD, or null
  /** Per-key-question ratings (may be absent for unrated locations) */
  keyQuestionRatings: {
    safe:       CqcRating | null
    effective:  CqcRating | null
    caring:     CqcRating | null
    responsive: CqcRating | null
    wellLed:    CqcRating | null
  }
}

// Raw shape returned by the CQC API (only fields we use)
type CqcApiLocation = {
  locationId:         string
  name:               string
  registrationStatus: string
  currentRatings?: {
    overall?: {
      rating:     string
      reportDate: string   // 'YYYY-MM-DD'
    }
    safe?:       { rating: string }
    effective?:  { rating: string }
    caring?:     { rating: string }
    responsive?: { rating: string }
    wellLed?:    { rating: string }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function asRating(value: string | undefined | null): CqcRating | null {
  if (!value) return null
  const map: Record<string, CqcRating> = {
    'outstanding':        'Outstanding',
    'good':               'Good',
    'requires improvement': 'Requires improvement',
    'inadequate':         'Inadequate',
  }
  return map[value.toLowerCase()] ?? null
}

function buildUrl(path: string): string {
  return `${CQC_API_BASE}${path}?partnerCode=${PARTNER_CODE}`
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch a single CQC location by its Location ID (e.g. "1-1234567890").
 * Returns null if the location is not found or the API is unavailable.
 */
export async function fetchCqcLocation(
  locationId: string
): Promise<CqcLocationData | null> {
  if (!locationId?.trim()) return null

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT)

  try {
    const res = await fetch(buildUrl(`/locations/${encodeURIComponent(locationId.trim())}`), {
      signal:  controller.signal,
      headers: { Accept: 'application/json' },
      // Don't cache at the fetch layer — we manage staleness ourselves in the DB
      cache: 'no-store',
    })

    if (!res.ok) {
      // 404 = location not found; other errors = API problem
      if (res.status !== 404) {
        console.warn(`[cqc] API returned ${res.status} for location ${locationId}`)
      }
      return null
    }

    const raw: CqcApiLocation = await res.json()

    const overall          = raw.currentRatings?.overall
    const overallRating    = asRating(overall?.rating)
    const lastInspectionDate = overall?.reportDate ?? null

    return {
      locationId:         raw.locationId,
      locationName:       raw.name,
      registrationStatus: raw.registrationStatus,
      overallRating,
      lastInspectionDate,
      keyQuestionRatings: {
        safe:       asRating(raw.currentRatings?.safe?.rating),
        effective:  asRating(raw.currentRatings?.effective?.rating),
        caring:     asRating(raw.currentRatings?.caring?.rating),
        responsive: asRating(raw.currentRatings?.responsive?.rating),
        wellLed:    asRating(raw.currentRatings?.wellLed?.rating),
      },
    }
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      console.warn(`[cqc] Timeout fetching location ${locationId}`)
    } else {
      console.warn(`[cqc] Error fetching location ${locationId}:`, err)
    }
    return null
  } finally {
    clearTimeout(timer)
  }
}

// ── Display helpers ───────────────────────────────────────────────────────────

/**
 * CQC's official colour palette for each rating level.
 * Sourced from https://www.cqc.org.uk/about-us/how-we-do-our-job/our-ratings-scores (Jan 2026).
 * Returns Tailwind-compatible inline style values (hex) for bg and text.
 */
export function cqcRatingColours(rating: CqcRating | null | undefined): {
  bg: string
  text: string
  border: string
} {
  switch (rating) {
    case 'Outstanding':
      return { bg: '#003087', text: '#ffffff', border: '#003087' }
    case 'Good':
      return { bg: '#4a7c2f', text: '#ffffff', border: '#4a7c2f' }
    case 'Requires improvement':
      return { bg: '#f4a83a', text: '#1a1a1a', border: '#f4a83a' }
    case 'Inadequate':
      return { bg: '#9e2311', text: '#ffffff', border: '#9e2311' }
    default:
      return { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' }
  }
}

/**
 * Format a CQC rating date (YYYY-MM-DD) as a human-readable string.
 * Returns null if the date is missing.
 */
export function formatCqcDate(isoDate: string | null | undefined): string | null {
  if (!isoDate) return null
  try {
    return new Date(isoDate).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
  } catch {
    return isoDate
  }
}
