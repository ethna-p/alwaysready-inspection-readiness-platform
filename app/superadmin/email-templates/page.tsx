/**
 * /superadmin/email-templates — lists every customer-facing email template,
 * grouped, with a "Customized" / "Default" badge, linking to the editor.
 */
export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { listTemplatesForSuperadmin } from './actions'

export default async function EmailTemplatesPage() {
  const templates = await listTemplatesForSuperadmin()

  const groups = new Map<string, typeof templates>()
  for (const t of templates) {
    if (!groups.has(t.group)) groups.set(t.group, [])
    groups.get(t.group)!.push(t)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink mb-1">Email templates</h1>
        <p className="text-ink-muted text-sm">
          Edit the HTML of any customer-facing email. Changes take effect on the next send,
          no deploy needed. Every save keeps the previous version, so you can always roll back.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {Array.from(groups.entries()).map(([group, items]) => (
          <div key={group}>
            <h2 className="text-sm font-semibold text-ink-muted uppercase tracking-wide mb-3">{group}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map(t => (
                <Link
                  key={t.id}
                  href={`/superadmin/email-templates/${t.id}`}
                  className="bg-card border border-line rounded-lg p-4 hover:border-brand transition-colors flex flex-col gap-2"
                >
                  <p className="font-medium text-ink text-sm">{t.label}</p>
                  <span
                    className={
                      'text-xs font-medium px-2 py-0.5 rounded-full w-fit ' +
                      (t.customized ? 'bg-[#00b8a6]/15 text-[#00776b]' : 'bg-fill-dim text-ink-muted')
                    }
                  >
                    {t.customized ? 'Customized' : 'Default'}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
