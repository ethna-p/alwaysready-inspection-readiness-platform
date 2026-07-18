import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Generates a stateless HMAC-SHA256 token for a given user ID.
 * The token is used in unsubscribe links and verified server-side
 * without needing a database lookup table.
 *
 * Requires UNSUBSCRIBE_SECRET to be set in environment variables.
 */
export function generateUnsubscribeToken(userId: string): string {
  const secret = process.env.UNSUBSCRIBE_SECRET
  if (!secret) throw new Error('UNSUBSCRIBE_SECRET environment variable is not set.')
  return createHmac('sha256', secret).update(userId).digest('hex')
}

/**
 * Verifies that a token matches the expected HMAC for the given user ID.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verifyUnsubscribeToken(userId: string, token: string): boolean {
  try {
    const expected = generateUnsubscribeToken(userId)
    const expectedBuf = Buffer.from(expected, 'hex')
    const actualBuf   = Buffer.from(token,    'hex')
    if (expectedBuf.length !== actualBuf.length) return false
    return timingSafeEqual(expectedBuf, actualBuf)
  } catch {
    return false
  }
}

/**
 * Returns the full unsubscribe URL for inclusion in email footers.
 * BASE_URL should be the platform's public URL (e.g. https://alwaysready-inspection-readiness-pl-three.vercel.app)
 */
export function buildUnsubscribeUrl(userId: string): string {
  const base  = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://alwaysready-inspection-readiness-pl-three.vercel.app'
  const token = generateUnsubscribeToken(userId)
  return `${base}/unsubscribe?uid=${encodeURIComponent(userId)}&token=${encodeURIComponent(token)}`
}
