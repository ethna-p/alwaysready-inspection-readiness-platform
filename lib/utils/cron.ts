/**
 * Cron endpoint authentication helper.
 *
 * Single authoritative CRON_SECRET check used by all cron routes.
 * Import verifyCronSecret() instead of duplicating the inline check —
 * differences between copies can leave individual routes unprotected
 * when the shared logic is updated.
 *
 * Behaviour:
 *   - Returns false (reject) if CRON_SECRET is not set in the environment.
 *   - Returns false if the Authorization header is missing or does not match
 *     "Bearer <CRON_SECRET>" exactly (case-sensitive).
 *   - Returns true only when the header matches.
 */

/**
 * Verifies the CRON_SECRET bearer token on an incoming cron request.
 *
 * @param request - The incoming Request (or NextRequest) object.
 * @returns true if the request is authorised, false otherwise.
 */
export function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${secret}`
}
