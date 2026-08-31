import { describe, it, expect } from 'vitest'
import { calculateRAG } from '@/lib/rag'

// Fixed reference date for all tests
const NOW = new Date('2026-08-31T12:00:00Z')

function daysFromNow(n: number): string {
  const d = new Date(NOW)
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

describe('calculateRAG', () => {
  // ── Grey ────────────────────────────────────────────────────────────────────

  it('returns grey when record is null', () => {
    expect(calculateRAG(null, NOW)).toBe('grey')
  })

  it('returns grey when record is undefined', () => {
    expect(calculateRAG(undefined, NOW)).toBe('grey')
  })

  it('returns grey when date_reviewed is null', () => {
    expect(calculateRAG({ date_reviewed: null, next_review_due: null }, NOW)).toBe('grey')
  })

  it('returns grey when date_reviewed is empty string', () => {
    expect(calculateRAG({ date_reviewed: '', next_review_due: null }, NOW)).toBe('grey')
  })

  // ── Red ─────────────────────────────────────────────────────────────────────

  it('returns red when next_review_due is yesterday', () => {
    expect(calculateRAG({
      date_reviewed: '2026-01-01',
      next_review_due: daysFromNow(-1),
    }, NOW)).toBe('red')
  })

  it('returns red when next_review_due is well in the past', () => {
    expect(calculateRAG({
      date_reviewed: '2025-01-01',
      next_review_due: '2025-06-01',
    }, NOW)).toBe('red')
  })

  it('returns red when next_review_due equals now (not strictly future)', () => {
    // Exactly at midnight of NOW — still past
    const midnight = new Date('2026-08-31T00:00:00Z')
    expect(calculateRAG({
      date_reviewed: '2026-01-01',
      next_review_due: '2026-08-31',
    }, new Date('2026-08-31T12:00:00Z'))).toBe('red')
  })

  // ── Amber ────────────────────────────────────────────────────────────────────

  it('returns amber when next_review_due is exactly 14 days away', () => {
    expect(calculateRAG({
      date_reviewed: '2026-01-01',
      next_review_due: daysFromNow(14),
    }, NOW)).toBe('amber')
  })

  it('returns amber when next_review_due is 1 day away', () => {
    expect(calculateRAG({
      date_reviewed: '2026-01-01',
      next_review_due: daysFromNow(1),
    }, NOW)).toBe('amber')
  })

  it('returns amber when next_review_due is 7 days away', () => {
    expect(calculateRAG({
      date_reviewed: '2026-01-01',
      next_review_due: daysFromNow(7),
    }, NOW)).toBe('amber')
  })

  // ── Green ────────────────────────────────────────────────────────────────────

  it('returns green when next_review_due is 15 days away', () => {
    expect(calculateRAG({
      date_reviewed: '2026-01-01',
      next_review_due: daysFromNow(15),
    }, NOW)).toBe('green')
  })

  it('returns green when next_review_due is far in the future', () => {
    expect(calculateRAG({
      date_reviewed: '2026-01-01',
      next_review_due: daysFromNow(90),
    }, NOW)).toBe('green')
  })

  it('returns green when date_reviewed is set but next_review_due is null', () => {
    // No due date set — falls through to green (not overdue, not due soon)
    expect(calculateRAG({
      date_reviewed: '2026-01-01',
      next_review_due: null,
    }, NOW)).toBe('green')
  })

  // ── Priority order ───────────────────────────────────────────────────────────

  it('red takes priority over amber window (overdue beats due-soon)', () => {
    // next_review_due is in the past — must be red, not amber
    expect(calculateRAG({
      date_reviewed: '2026-01-01',
      next_review_due: daysFromNow(-1),
    }, NOW)).toBe('red')
  })
})
