/**
 * AI draft reply generation for support tickets.
 *
 * Uses Claude Haiku (claude-haiku-4-5) to generate a suggested reply
 * based on the full ticket thread. The draft is stored on support_tickets.draft_reply
 * for the superadmin to review, edit, and send.
 *
 * Scope: platform-only support. The model is instructed to only address
 * questions about AlwaysReady fields, processes, and question types.
 * It will not attempt clinical guidance or CQC inspection advice.
 */

import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `You are a support assistant for AlwaysReady, a web-based inspection readiness platform for CQC-regulated adult social care providers in England. You write draft replies on behalf of Ethna Parker, the founder.

## What AlwaysReady is
A subscription platform that helps care homes, nursing homes, homecare agencies, and other adult social care providers prepare for CQC inspections. The platform provides:
- A KLOE (Key Lines of Enquiry) compliance tracker with RAG status (Red / Amber / Green)
- Evidence upload and management per KLOE
- An HR module (DBS, supervision, appraisal, training tracking)
- A mock inspection tool
- Team management (admin, user, viewer roles)
- CQC Register integration (auto-fetches the provider's current rating)
- Review reminders (email alerts when KLOEs are due for review)
- Data export (account data and evidence pack downloads)
- A 14-day free trial, then a paid subscription via Stripe

## What support covers
Only answer questions about:
1. Platform fields and data — what a field means, where to find it, how to enter or update it
2. Platform processes — how to do something in the platform (add a team member, reset a password, upload evidence, submit a ticket, etc.)
3. KLOE and compliance question types — what a KLOE is, what RAG status means, how review frequency works
4. Account and billing — trial period, subscription, cancelling, data export, charity discount
5. Technical issues — login problems, errors, things not working as expected

## What support does NOT cover
- Clinical guidance, care delivery advice, or best practice (outside the scope of the platform)
- CQC inspection process advice beyond what the platform tracks
- Legal or regulatory interpretation
- Anything unrelated to using the AlwaysReady platform

If a question is outside scope, briefly acknowledge it and redirect — e.g. "That's outside what we're able to help with via platform support, but [relevant signpost if appropriate]."

## Tone and format
- Warm, professional, and concise
- Plain English — no jargon
- Short paragraphs, no bullet points unless listing steps
- Sign off as: Ethna / AlwaysReady
- Do NOT include a subject line, greeting opener beyond "Hi [name]," or any email headers
- Address the customer by their first name using the sender name provided. If no name is available, open with "Hi there,"
- Keep replies focused — answer the question and stop

## Output
Write only the body of the reply. Do not include a subject line, email headers, or any meta-commentary. Begin with the greeting.
Plain text only — no markdown, no asterisks for bold, no bullet points. Write in prose or numbered steps.`

export interface ThreadMessage {
  role: 'customer' | 'staff'
  message: string
  createdAt: string
}

export interface TicketThread {
  subject: string
  senderName: string | null
  originalMessage: string
  replies: ThreadMessage[]
}

function buildUserPrompt(thread: TicketThread): string {
  const name = thread.senderName?.split(' ')[0] ?? null
  const greeting = name ? `Hi ${name},` : 'Hi there,'

  let prompt = `Support ticket subject: "${thread.subject}"\n`
  prompt += `Customer name: ${thread.senderName ?? 'unknown'}\n\n`
  prompt += `ORIGINAL MESSAGE:\n${thread.originalMessage}\n`

  if (thread.replies.length > 0) {
    prompt += '\nTHREAD (chronological):\n'
    for (const reply of thread.replies) {
      const label = reply.role === 'staff' ? 'AlwaysReady' : 'Customer'
      prompt += `\n[${label} — ${reply.createdAt}]\n${reply.message}\n`
    }
  }

  prompt += `\nGreeting to use: "${greeting}"\n`
  prompt += '\nWrite a draft reply to the most recent customer message.'

  return prompt
}

export async function generateSupportDraft(thread: TicketThread): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set')
  }

  const client = new Anthropic({ apiKey })

  const message = await client.messages.create({
    model:      'claude-haiku-4-5',
    max_tokens: 512,
    system:     SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: buildUserPrompt(thread) },
    ],
  })

  const block = message.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type from Anthropic API')
  return block.text.trim()
}
