/**
 * /dashboard/admin/team — Team management page (admins only).
 *
 * Allows admins to:
 *   - View all team members with their role and login ID
 *   - Add a new team member (generates username + temp password)
 *   - Change a team member's role
 *   - Reset a team member's password
 */

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/session'
import AddMemberForm from './add-member-form'
import MemberRow from './member-row'
import AddVisitorForm from './add-visitor-form'
import VisitorRow from './visitor-row'

export default async function TeamPage() {
  const profile = await getCurrentUserProfile()
  if (!profile || profile.role !== 'admin') notFound()

  const supabase = await createClient()

  const { data: allUsers } = await supabase
    .from('users')
    .select('id, full_name, username, email, role, viewer_expires_at, created_at')
    .eq('organisation_id', profile.organisation_id)
    .order('full_name', { ascending: true })

  const members  = (allUsers ?? []).filter(u => u.role !== 'viewer')
  const visitors = (allUsers ?? []).filter(u => u.role === 'viewer')

  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-2" aria-label="Breadcrumb">
        <ol className="flex gap-1">
          <li><Link href="/dashboard" className="hover:text-[#014D4E] underline">Dashboard</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-[#1a1a1a]" aria-current="page">Team</li>
        </ol>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#014D4E]">Team management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Add team members, assign roles, and manage login credentials.
          </p>
        </div>
      </div>

      <div className="space-y-8">

        {/* ── Team members list ──────────────────────────────────────────── */}
        <section aria-labelledby="team-list-heading">
          <h2 id="team-list-heading" className="text-lg font-bold text-[#014D4E] mb-4">
            Team members
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({members.length})
            </span>
          </h2>

          {members.length === 0 ? (
            <p className="text-sm text-gray-500">No team members yet. Add your first below.</p>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                    <th scope="col" className="text-left px-4 py-3 font-medium">Name / Login ID</th>
                    <th scope="col" className="text-left px-4 py-3 font-medium">Role</th>
                    <th scope="col" className="text-left px-4 py-3 font-medium">Password</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {members.map(member => (
                    <MemberRow
                      key={member.id}
                      member={member}
                      isSelf={member.id === profile.id}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Role guide ─────────────────────────────────────────────────── */}
        <section
          className="bg-[#faf9f6] rounded-xl border border-gray-200 p-5 text-sm"
          aria-labelledby="role-guide-heading"
        >
          <h2 id="role-guide-heading" className="font-semibold text-[#014D4E] mb-3">
            Role guide
          </h2>
          <dl className="space-y-2 text-[#1a1a1a]">
            <div className="flex gap-2">
              <dt className="font-medium w-16 shrink-0">Admin</dt>
              <dd className="text-gray-600">Full access — view and edit all KLOEs, assign tasks, manage team, create inspector logins.</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium w-16 shrink-0">User</dt>
              <dd className="text-gray-600">Can view all KLOEs and update the ones assigned to them. Sees their personal "My KLOEs" view on login.</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium w-16 shrink-0">Viewer</dt>
              <dd className="text-gray-600">Read-only access — for board members, owners, or CQC inspectors. Cannot edit anything.</dd>
            </div>
          </dl>
        </section>

        {/* ── Add team member ────────────────────────────────────────────── */}
        <section
          className="bg-white rounded-xl border border-gray-200 p-5"
          aria-labelledby="add-member-heading"
        >
          <h2 id="add-member-heading" className="text-sm font-semibold text-[#014D4E] uppercase tracking-wide mb-1">
            Add team member
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            A login ID and temporary password will be generated. Give them to the team member directly — they do not need an email address.
          </p>
          <AddMemberForm />
        </section>

        {/* ── Visitor logins ─────────────────────────────────────────────── */}
        <section aria-labelledby="visitor-list-heading">
          <h2 id="visitor-list-heading" className="text-lg font-bold text-[#014D4E] mb-1">
            Visitor logins
            {visitors.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({visitors.length})
              </span>
            )}
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Read-only access for inspectors, board members, or other external visitors. Access expires automatically.
          </p>

          {visitors.length === 0 ? (
            <p className="text-sm text-gray-500">No visitor logins yet.</p>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                    <th scope="col" className="text-left px-4 py-3 font-medium">Name / Login ID</th>
                    <th scope="col" className="text-left px-4 py-3 font-medium">Access expires</th>
                    <th scope="col" className="text-left px-4 py-3 font-medium">Revoke</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {visitors.map(visitor => (
                    <VisitorRow key={visitor.id} visitor={visitor} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Create visitor login ───────────────────────────────────────── */}
        <section
          className="bg-white rounded-xl border border-gray-200 p-5"
          aria-labelledby="add-visitor-heading"
        >
          <h2 id="add-visitor-heading" className="text-sm font-semibold text-[#014D4E] uppercase tracking-wide mb-1">
            Create visitor login
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Create a temporary read-only login for an inspector or external visitor. They can view all KLOEs, the audit trail, trend data, and reports — but cannot make any changes.
          </p>
          <AddVisitorForm />
        </section>

      </div>
    </div>
  )
}
