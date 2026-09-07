/**
 * HTML escaping utility.
 *
 * A single authoritative implementation used by all email templates, API
 * routes, and server actions that interpolate user-supplied text into HTML.
 * Import this rather than defining a local copy — small differences between
 * local implementations can leave individual features unprotected when the
 * shared version is updated.
 */

/**
 * Escapes HTML special characters in a string so it is safe to interpolate
 * into an HTML context (email templates, notification bodies, etc.).
 *
 * Handles: & < > " '
 */
export function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
