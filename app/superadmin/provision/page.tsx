/**
 * /superadmin/provision — create a new organisation + admin user.
 *
 * Protected by proxy.ts: only SUPERADMIN_EMAIL may access this route.
 * Uses the service-role admin client to bypass RLS.
 */
'use client'

import { useActionState } from 'react'
import { provisionOrganisation, type ProvisionResult } from './actions'

const SERVICE_TYPES = [
  'Residential Care Home',
  'Nursing Home',
  'Dual-Registered Care Home',
  'ARBD Specialist Care Home',
  'Homecare Agency',
  'Extra Care Housing',
  'Shared Lives Scheme',
  'Supported Living',
  'Specialist College',
  'Residential Rehabilitation Service',
  'Community Drug and Alcohol Service',
]

export default function ProvisionPage() {
  const [result, action, pending] = useActionState<ProvisionResult | null, FormData>(
    provisionOrganisation,
    null
  )

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-1">Provision New Organisation</h1>
      <p className="text-sm text-gray-500 mb-8">
        Creates the org, admin user, and seeds 24 compliance records. The admin
        receives login credentials directly — no email verification required.
      </p>

      {/* Success state */}
      {result?.success && (
        <div className="bg-green-50 border border-green-300 rounded-xl p-6 mb-8">
          <p className="font-semibold text-green-700 mb-3">✓ Organisation provisioned</p>
          <dl className="space-y-1 text-sm text-gray-700">
            <div className="flex gap-3">
              <dt className="text-gray-500 w-28 shrink-0">Reference</dt>
              <dd className="font-mono">{result.reference}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-gray-500 w-28 shrink-0">Org ID</dt>
              <dd className="font-mono text-xs">{result.orgId}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-gray-500 w-28 shrink-0">User ID</dt>
              <dd className="font-mono text-xs">{result.userId}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-gray-500">
            Send the admin their email and password. They will be prompted to set
            preferences on first login.
          </p>
          <a
            href="/superadmin/provision"
            className="inline-block mt-4 text-sm font-semibold text-[#014D4E] hover:underline"
          >
            + Add another provider
          </a>
        </div>
      )}

      {/* Error state */}
      {result && !result.success && (
        <div className="bg-red-50 border border-red-300 rounded-xl p-4 mb-8 text-sm text-red-700">
          <strong>Error:</strong> {result.error}
        </div>
      )}

      {/* Form */}
      <form action={action} className="space-y-6">

        {/* Organisation */}
        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
            Organisation
          </legend>

          <div>
            <label className="block text-sm text-gray-700 mb-1" htmlFor="org_name">
              Organisation name <span className="text-red-400">*</span>
            </label>
            <input
              id="org_name"
              name="org_name"
              type="text"
              required
              placeholder="Sunrise Care Home"
              className="
                w-full bg-white border border-gray-300 rounded-lg
                px-4 py-2.5 text-sm text-[#1a1a1a] placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-[#00b8a6] focus:border-transparent
              "
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1" htmlFor="service_type">
              Service type <span className="text-red-400">*</span>
            </label>
            <select
              id="service_type"
              name="service_type"
              required
              className="
                w-full bg-white border border-gray-300 rounded-lg
                px-4 py-2.5 text-sm text-[#1a1a1a]
                focus:outline-none focus:ring-2 focus:ring-[#00b8a6] focus:border-transparent
              "
            >
              <option value="">Select service type…</option>
              {SERVICE_TYPES.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              id="is_beta"
              name="is_beta"
              type="checkbox"
              defaultChecked
              className="h-4 w-4 accent-[#00b8a6] rounded"
            />
            <label htmlFor="is_beta" className="text-sm text-gray-700">
              Beta user (manually invited — shown with Beta badge in Organisations list)
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              id="is_charity"
              name="is_charity"
              type="checkbox"
              className="h-4 w-4 accent-[#00b8a6] rounded"
            />
            <label htmlFor="is_charity" className="text-sm text-gray-700">
              Registered charity (20% discount applies — note only, no billing effect yet)
            </label>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1" htmlFor="trial_days">
              Trial length (days)
            </label>
            <input
              id="trial_days"
              name="trial_days"
              type="number"
              min={1}
              max={365}
              defaultValue={90}
              className="
                w-32 bg-white border border-gray-300 rounded-lg
                px-4 py-2.5 text-sm text-[#1a1a1a]
                focus:outline-none focus:ring-2 focus:ring-[#00b8a6] focus:border-transparent
              "
            />
          </div>
        </fieldset>

        <hr className="border-gray-200" />

        {/* Admin user */}
        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
            Admin user (RCM)
          </legend>

          <div>
            <label className="block text-sm text-gray-700 mb-1" htmlFor="admin_name">
              Full name <span className="text-red-400">*</span>
            </label>
            <input
              id="admin_name"
              name="admin_name"
              type="text"
              required
              placeholder="Jane Smith"
              className="
                w-full bg-white border border-gray-300 rounded-lg
                px-4 py-2.5 text-sm text-[#1a1a1a] placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-[#00b8a6] focus:border-transparent
              "
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1" htmlFor="admin_email">
              Email address <span className="text-red-400">*</span>
            </label>
            <input
              id="admin_email"
              name="admin_email"
              type="email"
              required
              placeholder="jane@example.com"
              className="
                w-full bg-white border border-gray-300 rounded-lg
                px-4 py-2.5 text-sm text-[#1a1a1a] placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-[#00b8a6] focus:border-transparent
              "
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1" htmlFor="admin_password">
              Temporary password <span className="text-red-400">*</span>
            </label>
            <input
              id="admin_password"
              name="admin_password"
              type="text"        /* Visible — you're setting it to share with them */
              required
              minLength={8}
              placeholder="Min 8 characters"
              className="
                w-full bg-gray-800 border border-gray-700 rounded-lg
                px-4 py-2.5 text-sm text-white placeholder-gray-500 font-mono
                focus:outline-none focus:ring-2 focus:ring-[#00b8a6] focus:border-transparent
              "
            />
            <p className="text-xs text-gray-500 mt-1">
              Shown in plain text so you can copy it. Share securely with the admin — they can change it via account settings.
            </p>
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={pending}
          className="
            w-full bg-[#00b8a6] text-white font-semibold text-sm
            py-3 rounded-xl
            hover:bg-[#009d8e]
            focus:outline-none focus:ring-2 focus:ring-[#00b8a6] focus:ring-offset-2 focus:ring-offset-[#faf9f6]
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        >
          {pending ? 'Provisioning…' : 'Provision organisation →'}
        </button>
      </form>
    </div>
  )
}
