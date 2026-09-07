/**
 * Cloudflare Turnstile verification helper.
 *
 * Single authoritative implementation used by all public form endpoints
 * (waitlist, contact, blog subscribe, trial). Import verifyTurnstile() instead
 * of duplicating the inline fetch block — differences between copies can leave
 * individual routes unprotected when the shared logic is updated.
 *
 * Behaviour:
 *   - If TURNSTILE_SECRET_KEY is not set, verification is skipped (ok: true).
 *     This allows local development without a Turnstile site key configured.
 *   - If the token is missing when a key IS configured, returns ok: false (400).
 *   - If the Turnstile API returns non-success, returns ok: false (400).
 *   - If the fetch throws (network error), returns ok: false (503).
 */

export type TurnstileResult =
  | { ok: true }
  | { ok: false; error: string; status: 400 | 503 }

/**
 * Verifies a Cloudflare Turnstile challenge token.
 *
 * @param token - The cf-turnstile-response value from the submitted form.
 * @param context - Short identifier used in error log messages (e.g. '[inbound-waitlist]').
 */
export async function verifyTurnstile(
  token: string | undefined | null,
  context = '[turnstile]'
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    // Not configured — skip verification (local dev / staging without widget).
    return { ok: true }
  }

  if (!token?.trim()) {
    return { ok: false, error: 'Security check required.', status: 400 }
  }

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token.trim())}`,
    })

    const data = await res.json() as { success: boolean }
    if (!data.success) {
      return { ok: false, error: 'Security check failed. Please try again.', status: 400 }
    }

    return { ok: true }
  } catch (err) {
    console.error(`${context} Turnstile verification error:`, err)
    return { ok: false, error: 'Security check unavailable. Please try again.', status: 503 }
  }
}
