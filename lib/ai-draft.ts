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

import { SYSTEM_PROMPT } from '@/lib/ai-draft-faq'
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
