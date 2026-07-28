/**
 * AlwaysReady — Cloudflare Email Worker
 *
 * Receives all inbound emails to @alwaysready.uk and forwards them
 * to the platform's /api/inbound-email webhook.
 *
 * DEPLOY STEPS:
 *   1. In Cloudflare dashboard → Workers & Pages → Create Worker
 *   2. Paste this script, name it "alwaysready-email-worker"
 *   3. Add environment variable: INBOUND_EMAIL_SECRET (generate a random string)
 *   4. In Email → Routing → Routing rules → Catch-all:
 *      Action = "Send to Worker" → select "alwaysready-email-worker"
 *   5. Add the same INBOUND_EMAIL_SECRET value to Vercel env vars
 *
 * The webhook endpoint is: https://portal.alwaysready.uk/api/inbound-email
 */

export default {
  async email(message, env) {
    // Read the raw email stream
    const rawEmail = await new Response(message.raw).text()

    // Parse sender info
    const from = message.from ?? ''
    const to   = message.to   ?? ''

    // Extract subject from raw headers
    const subjectMatch = rawEmail.match(/^Subject:\s*(.+)$/im)
    const subject = subjectMatch ? subjectMatch[1].trim() : '(No subject)'

    // Extract From display name if present e.g. "John Smith <john@example.com>"
    const fromHeaderMatch = rawEmail.match(/^From:\s*(.+)$/im)
    const fromHeader = fromHeaderMatch ? fromHeaderMatch[1].trim() : from
    const nameMatch  = fromHeader.match(/^"?([^"<]+)"?\s*</)
    const fromName   = nameMatch ? nameMatch[1].trim() : ''

    // Extract plain text body (everything after the blank line following headers)
    // This is a simple extraction — works for plain text emails
    // Multipart emails: extract the text/plain part
    let text = ''
    const textPartMatch = rawEmail.match(/Content-Type:\s*text\/plain[^\r\n]*\r?\n(?:[^\r\n]+\r?\n)*\r?\n([\s\S]+?)(?:\r?\n--|\r?\n\r?\n--|\z)/i)
    if (textPartMatch) {
      text = textPartMatch[1].trim()
    } else {
      // Fallback: everything after the double newline (end of headers)
      const bodyMatch = rawEmail.match(/\r?\n\r?\n([\s\S]+)/)
      text = bodyMatch ? bodyMatch[1].trim() : ''
    }

    // POST to platform webhook
    const response = await fetch('https://portal.alwaysready.uk/api/inbound-email', {
      method: 'POST',
      headers: {
        'Content-Type':     'application/json',
        'X-Inbound-Secret': env.INBOUND_EMAIL_SECRET ?? '',
      },
      body: JSON.stringify({ from, fromName, to, subject, text }),
    })

    if (!response.ok) {
      const body = await response.text()
      console.error(`[email-worker] webhook error ${response.status}: ${body}`)
      // Don't throw — silently accept the email to avoid bouncing it back to sender
    }
  },
}
