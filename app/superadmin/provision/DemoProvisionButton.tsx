'use client'

import { useState, useTransition } from 'react'
import { provisionDemoOrgs, type DemoOrgResult } from './provision-demo-orgs-action'

export default function DemoProvisionButton() {
  const [results, setResults]   = useState<DemoOrgResult[] | null>(null)
  const [error, setError]       = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm(
      'This will create 11 demo organisations with active subscriptions.\n\n' +
      'Save the credentials table that appears — passwords are generated once and not stored.\n\n' +
      'Proceed?'
    )) return

    startTransition(async () => {
      try {
        const r = await provisionDemoOrgs()
        setResults(r)
      } catch (err) {
        setError(String(err))
      }
    })
  }

  const successCount = results?.filter(r => r.success).length ?? 0
  const failCount    = results?.filter(r => !r.success).length ?? 0

  return (
    <div className="mt-10 pt-8 border-t border-line">
      <h2 className="text-base font-semibold text-ink mb-1">Demo Organisations</h2>
      <p className="text-sm text-ink-muted mb-4">
        Creates one demo org per service type with <strong>active</strong> subscription (no trial expiry).
        Credentials are also emailed to support@alwaysready.uk as a backup.
      </p>

      {!results && !error && (
        <button
          onClick={handleClick}
          disabled={isPending}
          className="
            bg-amber-500 text-white font-semibold text-sm
            px-6 py-2.5 rounded-xl
            hover:bg-amber-600
            focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        >
          {isPending ? 'Creating 11 demo orgs…' : 'Create 11 demo orgs →'}
        </button>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
      )}

      {results && (
        <div>
          <p className="text-sm font-medium mb-4">
            {successCount === 11
              ? <span className="text-green-700">✓ All 11 demo orgs created successfully</span>
              : <span className="text-amber-700">⚠ {successCount} succeeded, {failCount} failed — see table below</span>
            }
          </p>

          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-sm text-ink">
              <thead>
                <tr className="bg-card border-b border-line text-xs text-ink-muted uppercase tracking-wider">
                  <th className="px-4 py-3 text-left w-8"></th>
                  <th className="px-4 py-3 text-left">Service type</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Password</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {results.map((r, i) => (
                  <tr key={i} className={r.success ? '' : 'bg-red-50'}>
                    <td className="px-4 py-3 text-center">
                      {r.success
                        ? <span className="text-green-600">✓</span>
                        : <span className="text-red-500">✗</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-ink">{r.serviceType}</td>
                    <td className="px-4 py-3 font-mono text-xs text-ink">{r.email}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {r.success
                        ? <span className="text-ink">{r.password}</span>
                        : <span className="text-red-600">{r.error}</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-ink-muted mt-3 flex items-start gap-1.5">
            <span className="text-amber-500 font-bold shrink-0">⚠</span>
            Copy these passwords now — they are generated at runtime and cannot be recovered from the platform.
            A copy was also sent to support@alwaysready.uk.
          </p>
        </div>
      )}
    </div>
  )
}
