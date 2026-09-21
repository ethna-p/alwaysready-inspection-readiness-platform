/**
 * Pairs demo leads (website intake form) with Zeeg bookings for the superadmin Demo Pipeline.
 *
 * A lead and a booking are the same demo when they share an email. But one email can legitimately
 * appear on several leads (two people at one address, or repeat test entries), and matching on email
 * alone paired each booking with whichever lead came first in the list, regardless of who it was
 * for. So candidates that share an email are ranked by how well the rest lines up:
 *
 *   +4  same name (ignoring case and extra spaces, when both have one)
 *   +2  same demo type
 *   +1  same email (every candidate has this)
 *
 * The best-scoring pairs are assigned first; ties fall back to list order, as before. Each lead and
 * each booking is used at most once.
 */

export interface PipelineLead {
  id: string
  email: string | null
  name: string | null
  demo_type: string
}

export interface PipelineBooking {
  id: string
  invitee_email: string | null
  invitee_name: string | null
  demo_type: string
}

function normaliseName(name: string | null): string {
  return (name ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Returns a map of lead id -> the booking id that belongs with it. */
export function matchLeadsToBookings(leads: PipelineLead[], bookings: PipelineBooking[]): Map<string, string> {
  const candidates: { leadId: string; bookingId: string; score: number; leadIndex: number; bookingIndex: number }[] = []

  leads.forEach((lead, leadIndex) => {
    if (!lead.email) return
    const leadEmail = lead.email.toLowerCase()
    const leadName = normaliseName(lead.name)
    bookings.forEach((booking, bookingIndex) => {
      if (!booking.invitee_email || booking.invitee_email.toLowerCase() !== leadEmail) return
      let score = 1
      const bookingName = normaliseName(booking.invitee_name)
      if (leadName && bookingName && leadName === bookingName) score += 4
      if (lead.demo_type === booking.demo_type) score += 2
      candidates.push({ leadId: lead.id, bookingId: booking.id, score, leadIndex, bookingIndex })
    })
  })

  candidates.sort((a, b) => b.score - a.score || a.leadIndex - b.leadIndex || a.bookingIndex - b.bookingIndex)

  const matched = new Map<string, string>()
  const usedBookings = new Set<string>()
  for (const c of candidates) {
    if (matched.has(c.leadId) || usedBookings.has(c.bookingId)) continue
    matched.set(c.leadId, c.bookingId)
    usedBookings.add(c.bookingId)
  }
  return matched
}
