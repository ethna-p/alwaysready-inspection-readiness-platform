/**
 * Shared validation helpers for values arriving from the client that must
 * be checked before being used in a database query or storage path.
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** True if `value` is a syntactically valid UUID (any version). */
export function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value)
}
