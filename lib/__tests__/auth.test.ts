import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { UserProfile } from '@/lib/session'

// Mock the session module before importing auth helpers
vi.mock('@/lib/session', () => ({
  getCurrentUserProfile: vi.fn(),
}))

import { requireUser, requireAdmin, requireRole } from '@/lib/auth'
import { getCurrentUserProfile } from '@/lib/session'

const mockGetProfile = vi.mocked(getCurrentUserProfile)

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'user-123',
    email: 'test@example.com',
    full_name: 'Test User',
    username: 'testuser',
    role: 'user',
    organisation_id: 'org-456',
    viewer_expires_at: null,
    personal_email: null,
    mobile_number: null,
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ── requireUser ──────────────────────────────────────────────────────────────

describe('requireUser', () => {
  it('returns profile when authenticated with organisation_id', async () => {
    const profile = makeProfile()
    mockGetProfile.mockResolvedValue(profile)
    const result = await requireUser()
    expect(result).toEqual(profile)
  })

  it('returns null when not authenticated (profile is null)', async () => {
    mockGetProfile.mockResolvedValue(null)
    const result = await requireUser()
    expect(result).toBeNull()
  })

  it('returns null when profile has no organisation_id', async () => {
    mockGetProfile.mockResolvedValue(makeProfile({ organisation_id: null as unknown as string }))
    const result = await requireUser()
    expect(result).toBeNull()
  })
})

// ── requireAdmin ─────────────────────────────────────────────────────────────

describe('requireAdmin', () => {
  it('returns profile when role is admin', async () => {
    const profile = makeProfile({ role: 'admin' })
    mockGetProfile.mockResolvedValue(profile)
    const result = await requireAdmin()
    expect(result).toEqual(profile)
  })

  it('returns null when role is user', async () => {
    mockGetProfile.mockResolvedValue(makeProfile({ role: 'user' }))
    const result = await requireAdmin()
    expect(result).toBeNull()
  })

  it('returns null when role is viewer', async () => {
    mockGetProfile.mockResolvedValue(makeProfile({ role: 'viewer' }))
    const result = await requireAdmin()
    expect(result).toBeNull()
  })

  it('returns null when not authenticated', async () => {
    mockGetProfile.mockResolvedValue(null)
    const result = await requireAdmin()
    expect(result).toBeNull()
  })
})

// ── requireRole ──────────────────────────────────────────────────────────────

describe('requireRole', () => {
  it('returns profile when role is in allowedRoles', async () => {
    const profile = makeProfile({ role: 'user' })
    mockGetProfile.mockResolvedValue(profile)
    const result = await requireRole(['admin', 'user'])
    expect(result).toEqual(profile)
  })

  it('returns profile when role is admin and admin is allowed', async () => {
    const profile = makeProfile({ role: 'admin' })
    mockGetProfile.mockResolvedValue(profile)
    const result = await requireRole(['admin'])
    expect(result).toEqual(profile)
  })

  it('returns null when role is not in allowedRoles', async () => {
    mockGetProfile.mockResolvedValue(makeProfile({ role: 'viewer' }))
    const result = await requireRole(['admin', 'user'])
    expect(result).toBeNull()
  })

  it('returns null when not authenticated', async () => {
    mockGetProfile.mockResolvedValue(null)
    const result = await requireRole(['admin', 'user', 'viewer'])
    expect(result).toBeNull()
  })

  it('returns profile when viewer is explicitly allowed', async () => {
    const profile = makeProfile({ role: 'viewer' })
    mockGetProfile.mockResolvedValue(profile)
    const result = await requireRole(['viewer'])
    expect(result).toEqual(profile)
  })
})

// ── viewer expiry (handled in getCurrentUserProfile, verified via requireUser) ──

describe('viewer expiry (via requireUser)', () => {
  it('returns null when getCurrentUserProfile returns null for expired viewer', async () => {
    // session.ts returns null for expired viewers — requireUser propagates this
    mockGetProfile.mockResolvedValue(null)
    const result = await requireUser()
    expect(result).toBeNull()
  })
})
