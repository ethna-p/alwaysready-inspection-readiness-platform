/**
 * Returns the first word of a full name, or a fallback string if the name is
 * null / undefined / empty. Consistent with the pattern used across the
 * codebase for personalising email subjects and bodies.
 *
 * @example
 *   getFirstName('Jane Smith')   // → 'Jane'
 *   getFirstName(null)           // → 'there'
 *   getFirstName(null, 'friend') // → 'friend'
 */
export function getFirstName(
  fullName: string | null | undefined,
  fallback = 'there',
): string {
  return fullName?.split(' ')[0] ?? fallback
}
