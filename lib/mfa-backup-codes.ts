/**
 * Shared helpers for MFA backup codes — generation (used when a user
 * completes TOTP enrolment or regenerates from Account settings) and
 * hashing (used both when storing new codes and when checking a submitted
 * one at redemption). Kept in one place so the two call sites can never
 * drift on format or hash algorithm.
 *
 * A backup code is a high-entropy random token, not a user-chosen secret —
 * a plain SHA-256 of it is the standard approach (this is what GitHub's own
 * recovery codes do) and needs no per-code salt or slow hash like bcrypt.
 */
import { createHash, randomInt } from 'crypto'

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // no 0/O/1/I — avoids misreads when copied by hand
const GROUP_LENGTH = 5
const GROUPS_PER_CODE = 2
export const BACKUP_CODE_COUNT = 10

/** Returns BACKUP_CODE_COUNT freshly generated plaintext codes, e.g. "7K4QP-9XMRT". */
export function generateBackupCodes(): string[] {
  return Array.from({ length: BACKUP_CODE_COUNT }, () => {
    const groups = Array.from({ length: GROUPS_PER_CODE }, () =>
      Array.from({ length: GROUP_LENGTH }, () => CODE_CHARS[randomInt(CODE_CHARS.length)]).join('')
    )
    return groups.join('-')
  })
}

/** Strips formatting and normalises case so "7k4qp 9xmrt" and "7K4QP-9XMRT" hash identically. */
export function normalizeBackupCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function hashBackupCode(code: string): string {
  return createHash('sha256').update(normalizeBackupCode(code)).digest('hex')
}
