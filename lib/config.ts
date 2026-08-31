/**
 * Shared platform configuration constants.
 * Import from here rather than defining inline.
 */

export const PLATFORM_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://portal.alwaysready.uk').replace(/\/$/, '')
