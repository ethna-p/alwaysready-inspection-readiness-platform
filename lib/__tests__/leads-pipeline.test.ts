import { describe, it, expect } from 'vitest'
import { matchLeadsToBookings, type PipelineLead, type PipelineBooking } from '../leads-pipeline'

const email = 'shared@example.test'
// Newest first, as the page loads them.
const laura: PipelineLead = { id: 'lead-laura', email, name: 'Laura Parker', demo_type: '30min' }
const peter: PipelineLead = { id: 'lead-peter', email, name: 'Peter Parker', demo_type: '30min' }

describe('matchLeadsToBookings', () => {
  it('pairs a booking with the lead whose name matches, not just the first lead with that email', () => {
    // The reported bug: two leads share an email; a booking for Peter went to Laura (first in the list).
    const bookings: PipelineBooking[] = [{ id: 'b-peter', invitee_email: email, invitee_name: 'Peter Parker', demo_type: '30min' }]
    expect([...matchLeadsToBookings([laura, peter], bookings)]).toEqual([['lead-peter', 'b-peter']])
  })

  it('pairs two bookings with the right two leads whatever order they arrive in', () => {
    const bookings: PipelineBooking[] = [
      { id: 'b-peter', invitee_email: email, invitee_name: 'Peter Parker', demo_type: '30min' },
      { id: 'b-laura', invitee_email: email, invitee_name: 'Laura Parker', demo_type: '30min' },
    ]
    const m = matchLeadsToBookings([laura, peter], bookings)
    expect(m.get('lead-laura')).toBe('b-laura')
    expect(m.get('lead-peter')).toBe('b-peter')
  })

  it('ignores case and extra spaces in names, and case in emails', () => {
    const bookings: PipelineBooking[] = [{ id: 'b', invitee_email: email.toUpperCase(), invitee_name: '  peter   PARKER ', demo_type: '30min' }]
    expect(matchLeadsToBookings([laura, peter], bookings).get('lead-peter')).toBe('b')
  })

  it('uses demo type to choose between leads when names do not help', () => {
    const a: PipelineLead = { id: 'a', email, name: null, demo_type: '15min' }
    const b: PipelineLead = { id: 'b', email, name: null, demo_type: '30min' }
    const bookings: PipelineBooking[] = [{ id: 'bk', invitee_email: email, invitee_name: null, demo_type: '30min' }]
    expect([...matchLeadsToBookings([a, b], bookings)]).toEqual([['b', 'bk']])
  })

  it('falls back to list order for identical candidates, using each lead and booking once', () => {
    const a: PipelineLead = { id: 'a', email, name: null, demo_type: '30min' }
    const b: PipelineLead = { id: 'b', email, name: null, demo_type: '30min' }
    const bookings: PipelineBooking[] = [
      { id: 'bk1', invitee_email: email, invitee_name: null, demo_type: '30min' },
      { id: 'bk2', invitee_email: email, invitee_name: null, demo_type: '30min' },
    ]
    expect([...matchLeadsToBookings([a, b], bookings)]).toEqual([['a', 'bk1'], ['b', 'bk2']])
  })

  it('still pairs by email alone when names differ and there is no better candidate', () => {
    const bookings: PipelineBooking[] = [{ id: 'b', invitee_email: email, invitee_name: 'Pete', demo_type: '15min' }]
    expect(matchLeadsToBookings([peter], bookings).get('lead-peter')).toBe('b')
  })

  it('does not pair different emails or leads without an email', () => {
    const other: PipelineLead = { id: 'x', email: 'other@example.test', name: 'X', demo_type: '30min' }
    const noEmail: PipelineLead = { id: 'y', email: null, name: 'Y', demo_type: '30min' }
    const bookings: PipelineBooking[] = [{ id: 'b', invitee_email: email, invitee_name: 'X', demo_type: '30min' }]
    expect(matchLeadsToBookings([other, noEmail], bookings).size).toBe(0)
  })
})
