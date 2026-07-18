'use client'

/**
 * /superadmin/tickets/new
 * Opens a support ticket on behalf of a customer organisation.
 * The first message appears as an AlwaysReady staff message on the customer side.
 */

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { getOrganisationsForTicket, openTicketForCustomer, type OrgOption } from './actions'

export default function NewTicketPage() {
  const [orgs, setOrgs]         = useState<OrgOption[]>([])
  const [orgId, setOrgId]       = useState('')
  const [subject, setSubject]   = useState('')
  const [message, setMessage]   = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    getOrganisationsForTicket().then(setOrgs)
  }, [])

  const selectedOrg = orgs.find(o => o.id === orgId) ?? null

  function handleSubmit() {
    setError(null)
    if (!orgId) { setError('Please select an organisation.'); return }
    if (!subject.trim()) { setError('Please enter a subject.'); return }
    if (!message.trim()) { setError('Please enter a message.'); return }

    startTransition(async () => {
      const result = await openTicketForCustomer(orgId, subject, message)
      if (result && 'error' in result) {
        setError(result.error)
      }
      // On success the action redirects — no state update needed
    })
  }

  return (
    <div className="max-w-2xl">
      <Link href="/superadmin/tickets" className="text-sm text-gray-400 hover:text-white mb-6 block">
        ← All tickets
      </Link>

      <h1 className="text-2xl font-bold text-white mb-1">New ticket</h1>
      <p className="text-sm text-gray-400 mb-8">
        Open a support ticket on behalf of a customer. The message will appear as an AlwaysReady staff message in their helpdesk.
      </p>

      <div className="space-y-6">

        {/* Organisation */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Organisation
          </label>
          <select
            value={orgId}
            onChange={e => setOrgId(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#00b8a6]"
          >
            <option value="">— Select an organisation —</option>
            {orgs.map(org => (
              <option key={org.id} value={org.id}>
                {org.name}
                {org.adminEmail ? ` (${org.adminEmail})` : ''}
              </option>
            ))}
          </select>

          {selectedOrg && (
            <p className="mt-2 text-xs text-gray-500">
              {selectedOrg.adminName
                ? `Admin: ${selectedOrg.adminName}${selectedOrg.adminEmail ? ` · ${selectedOrg.adminEmail}` : ''}`
                : selectedOrg.adminEmail
                  ? `Admin: ${selectedOrg.adminEmail}`
                  : 'No admin user found for this organisation.'}
            </p>
          )}
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="e.g. Important update to your account"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#00b8a6]"
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Message
          </label>
          <p className="text-xs text-gray-500 mb-2">
            This will appear as the first message from AlwaysReady Support in the customer&apos;s ticket thread.
          </p>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={8}
            placeholder="Write your message to the customer here…"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#00b8a6] resize-none"
          />
        </div>

        {/* Preview */}
        {(subject.trim() || message.trim()) && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Customer will see
            </p>
            {subject.trim() && (
              <p className="text-sm font-semibold text-white mb-3">{subject}</p>
            )}
            <div className="rounded-lg p-4 bg-[#014D4E]/30 border border-[#00b8a6]/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-[#00b8a6]">AlwaysReady Support</span>
              </div>
              <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
                {message || <span className="text-gray-600 italic">Your message will appear here…</span>}
              </p>
            </div>
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1 bg-[#014D4E] hover:bg-[#00b8a6] hover:text-[#014D4E] text-white font-semibold py-3 rounded-lg transition-colors text-sm disabled:opacity-50"
          >
            {isPending ? 'Opening ticket…' : 'Open ticket'}
          </button>
          <Link
            href="/superadmin/tickets"
            className="flex-1 text-center bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-3 rounded-lg text-sm transition-colors"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  )
}
