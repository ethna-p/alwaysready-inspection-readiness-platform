/**
 * Content Security Policy, built per request.
 *
 * Scripts are allowed only if they carry this request's random nonce (or were loaded by a script that
 * does: 'strict-dynamic'). That is what stops an injected <script> from running. It replaces the old
 * static policy, which allowed 'unsafe-inline' and 'unsafe-eval' for scripts and so did not.
 *
 * The nonce is created in middleware.ts for every page request and passed to Next.js in the request's
 * own Content-Security-Policy header, which Next reads to stamp the nonce on its scripts. Because the
 * nonce must be fresh per request, every page has to be rendered per request (see app/layout.tsx).
 *
 * Deliberately NOT tightened: style-src keeps 'unsafe-inline'. React inline style="" attributes cannot
 * carry a nonce, and injected styles are a far smaller risk than injected scripts.
 *
 * Third parties, and why:
 *   Cloudflare Turnstile (challenges.cloudflare.com): the bot check on /trial. Its script is loaded by
 *     a nonced script so 'strict-dynamic' covers it; its widget is an iframe, so frame-src is needed.
 *   Supabase, Sentry (EU ingest): browser network calls (connect-src).
 */

export function buildCsp(nonce: string, isDev: boolean): string {
  const directives = [
    "default-src 'self'",
    // 'unsafe-eval' is development only: React uses eval there to rebuild server error stacks.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    // Supabase storage for org logos
    "img-src 'self' data: blob: https://*.supabase.co",
    "font-src 'self'",
    // Supabase (auth, database), Sentry EU ingest (data stays in Germany)
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.ingest.de.sentry.io",
    // Cloudflare Turnstile renders its challenge in an iframe
    'frame-src https://challenges.cloudflare.com',
    // Sentry session replay compresses in a web worker created from a blob: URL
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    // No iframes of this site anywhere; same effect as X-Frame-Options, CSP version
    "frame-ancestors 'none'",
  ]
  // Would break plain-http localhost, so production only.
  if (!isDev) directives.push('upgrade-insecure-requests')
  return directives.join('; ')
}

/** A fresh, unguessable nonce for one request. */
export function newNonce(): string {
  return btoa(crypto.randomUUID())
}
