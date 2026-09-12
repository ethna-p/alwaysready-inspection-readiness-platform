/**
 * Thin wrapper around otplib so the rest of the E2E code doesn't import it
 * directly — Supabase's TOTP factors are standard RFC 6238 (SHA1, 30s step,
 * 6 digits), which otplib's `generateSync` defaults to.
 */
import { generateSync } from 'otplib'

/** Computes the current valid 6-digit code for a base32 TOTP secret. */
export function currentTotpCode(secret: string): string {
  return generateSync({ secret })
}
