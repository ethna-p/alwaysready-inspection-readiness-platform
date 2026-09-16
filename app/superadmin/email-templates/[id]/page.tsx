/**
 * /superadmin/email-templates/[id] — the HTML editor for one template.
 */
export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTemplateForEdit } from '../actions'
import EmailTemplateEditor from './EmailTemplateEditor'

type Props = { params: Promise<{ id: string }> }

export default async function EmailTemplateEditPage({ params }: Props) {
  const { id } = await params

  let data
  try {
    data = await getTemplateForEdit(id)
  } catch {
    notFound()
  }

  return (
    <div>
      <Link href="/superadmin/email-templates" className="text-sm text-ink-muted hover:text-ink mb-4 inline-block">
        &larr; All templates
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink mb-1">{data.label}</h1>
        <p className="text-ink-muted text-sm">
          {data.group}
          {data.params.length > 0 && (
            <>
              {' · '}Placeholders: {data.params.map(p => `{{${p}}}`).join(', ')}
            </>
          )}
        </p>
      </div>
      <EmailTemplateEditor data={data} />
    </div>
  )
}
