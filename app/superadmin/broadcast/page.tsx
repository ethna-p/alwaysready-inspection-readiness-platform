'use client'

import { useState, useEffect, useTransition } from 'react'
import { getRecipientCount, sendBroadcast } from './actions'

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 48" role="img" aria-label="AlwaysReady" style="display:block;height:40px;width:auto"><circle cx="24" cy="24" r="22" fill="#ffd700"/><polyline points="13,24 21,32 35,16" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><text x="54" y="32" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#00b8a6" letter-spacing="-0.3">AlwaysReady</text></svg>`

export default function BroadcastPage() {
  const [subject, setSubject]       = useState('')
  const [intro, setIntro]           = useState('')
  const [postUrl, setPostUrl]       = useState('')
  const [buttonText, setButtonText] = useState('Read the full post')
  const [recipientCount, setRecipientCount] = useState<number | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [result, setResult]         = useState<{ sent: number; skipped: number } | null>(null)
  const [error, setError]           = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    getRecipientCount().then(setRecipientCount)
  }, [])

  // Build preview intro HTML
  const previewIntroHtml = intro
    ? intro.split(/\n\n+/).map(p =>
        `<p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">${p.trim().replace(/\n/g, '<br>')}</p>`
      ).join('')
    : '<p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#aaa;font-style:italic">Your intro will appear here…</p>'

  const previewBody = `
    <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#1a1a1a">Dear [Name],</p>
    ${previewIntroHtml}
    ${postUrl ? `
    <p style="margin:24px 0 0">
      <a href="${postUrl}" style="display:inline-block;background-color:#014D4E;color:#ffffff;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600;text-decoration:none">
        ${buttonText || 'Read the full post'}
      </a>
    </p>` : ''}
  `

  function handleSend() {
    setError(null)
    startTransition(async () => {
      const res = await sendBroadcast(subject, intro, postUrl, buttonText)
      if (res.error) {
        setError(res.error)
        setConfirming(false)
      } else {
        setResult({ sent: res.sent, skipped: res.skipped })
        setConfirming(false)
      }
    })
  }

  // Success state
  if (result) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Broadcast sent</h1>
        <p className="text-gray-400 mb-8">Here is a summary of this send.</p>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 max-w-sm">
          <div className="text-5xl font-bold text-[#00b8a6] mb-1">{result.sent}</div>
          <div className="text-gray-400 text-sm mb-6">emails delivered</div>
          {result.skipped > 0 && (
            <div className="text-gray-500 text-sm">
              {result.skipped} skipped (opted out or no valid address)
            </div>
          )}
          <button
            onClick={() => {
              setResult(null)
              setSubject('')
              setIntro('')
              setPostUrl('')
              setButtonText('Read the full post')
            }}
            className="mt-6 text-sm text-[#00b8a6] hover:underline"
          >
            Send another broadcast
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Send a broadcast</h1>
          <p className="text-gray-400 text-sm">
            Compose an email to send to all opted-in customers.
            {recipientCount !== null && (
              <span className="ml-2 bg-[#014D4E] text-[#00b8a6] text-xs font-semibold px-2 py-0.5 rounded">
                {recipientCount} recipient{recipientCount !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ── Compose panel ── */}
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Subject line
            </label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. New on the AlwaysReady blog"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#00b8a6]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Intro copy
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Write 1–3 short paragraphs. Separate paragraphs with a blank line.
            </p>
            <textarea
              value={intro}
              onChange={e => setIntro(e.target.value)}
              rows={8}
              placeholder={"We have just published a new article on the AlwaysReady blog that we think you will find useful.\n\nThis week we are looking at..."}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#00b8a6] resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Blog post URL
            </label>
            <input
              type="url"
              value={postUrl}
              onChange={e => setPostUrl(e.target.value)}
              placeholder="https://alwaysready.uk/blog/your-post"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#00b8a6]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Button text
            </label>
            <input
              type="text"
              value={buttonText}
              onChange={e => setButtonText(e.target.value)}
              placeholder="Read the full post"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#00b8a6]"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          {!confirming ? (
            <button
              onClick={() => {
                setError(null)
                if (!subject.trim() || !intro.trim() || !postUrl.trim()) {
                  setError('Subject, intro, and post URL are all required.')
                  return
                }
                setConfirming(true)
              }}
              className="w-full bg-[#014D4E] hover:bg-[#00b8a6] hover:text-[#014D4E] text-white font-semibold py-3 rounded-lg transition-colors text-sm"
            >
              Review and send
            </button>
          ) : (
            <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
              <p className="text-yellow-300 text-sm font-medium mb-1">
                Ready to send to {recipientCount ?? '…'} customer{recipientCount !== 1 ? 's' : ''}?
              </p>
              <p className="text-yellow-400/70 text-xs mb-4">
                This cannot be undone. Check the preview before confirming.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleSend}
                  disabled={isPending}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white font-semibold py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  {isPending ? 'Sending…' : 'Confirm send'}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  disabled={isPending}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-2 rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Preview panel ── */}
        <div>
          <p className="text-sm font-medium text-gray-300 mb-3">Preview</p>
          <div style={{
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
            backgroundColor: '#faf9f6',
            borderRadius: 8,
            overflow: 'hidden',
            border: '1px solid #374151',
          }}>
            {/* Email header */}
            <div style={{ backgroundColor: '#014D4E', padding: '20px 28px', borderBottom: '4px solid #ffd700' }}>
              <div dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
            </div>

            {/* Email body */}
            <div style={{ padding: '28px 28px 24px', backgroundColor: '#ffffff' }}
              dangerouslySetInnerHTML={{ __html: previewBody }}
            />

            {/* Email footer */}
            <div style={{ backgroundColor: '#faf9f6', borderTop: '1px solid #e8e6e0', padding: '16px 28px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 11, color: '#888', lineHeight: 1.6 }}>
                AlwaysReady is a product of Parker Digital &amp; Print Services Ltd<br />
                82A James Carter Road, Mildenhall, IP28 7DE
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 11 }}>
                <a href="#" style={{ color: '#014D4E' }}>Unsubscribe</a> from non-essential emails.
              </p>
            </div>
          </div>

          {subject && (
            <p className="mt-3 text-xs text-gray-500">
              <span className="text-gray-400 font-medium">Subject:</span> {subject}
            </p>
          )}
        </div>

      </div>
    </div>
  )
}
