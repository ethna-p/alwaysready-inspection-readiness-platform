'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { previewTemplateHtml, saveTemplate, restoreTemplateVersion, type TemplateEditData } from '../actions'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function EmailTemplateEditor({ data }: { data: TemplateEditData }) {
  const router = useRouter()
  const [html, setHtml] = useState(data.currentHtml)
  const [preview, setPreview] = useState('')
  // previewedHtml tracks which html string `preview` currently reflects, so
  // "loading" is derived (html !== previewedHtml) rather than a separate
  // setState called synchronously at the top of the effect body.
  const [previewedHtml, setPreviewedHtml] = useState<string | null>(null)
  const previewLoading = previewedHtml !== html
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [showVersions, setShowVersions] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)

  // Debounced live preview: re-render 500ms after the user stops typing.
  useEffect(() => {
    const timer = setTimeout(() => {
      const requestedHtml = html
      previewTemplateHtml(data.id, requestedHtml)
        .then(rendered => {
          setPreview(rendered)
          setPreviewedHtml(requestedHtml)
        })
        .catch(() => {
          setPreview('<p style="padding:20px;font-family:sans-serif;color:#b91c1c">Preview failed to render.</p>')
          setPreviewedHtml(requestedHtml)
        })
    }, 500)
    return () => clearTimeout(timer)
  }, [html, data.id])

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    setSaved(false)
    try {
      await saveTemplate(data.id, html)
      setSaved(true)
      router.refresh()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  async function handleRestore(versionId: string) {
    setRestoring(versionId)
    try {
      const restored = await restoreTemplateVersion(data.id, versionId)
      setHtml(restored.html)
      router.refresh()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to restore.')
    } finally {
      setRestoring(null)
    }
  }

  function handleResetToDefault() {
    setHtml(data.sampleHtml)
    setSaved(false)
  }

  const dirty = html !== data.currentHtml

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="flex flex-col gap-3">
          <label htmlFor="template-html" className="text-sm font-semibold text-ink">HTML</label>
          <textarea
            id="template-html"
            value={html}
            onChange={e => { setHtml(e.target.value); setSaved(false) }}
            spellCheck={false}
            className="w-full h-[520px] font-mono text-xs leading-relaxed bg-card border border-line rounded-lg p-4 text-ink focus:outline-none focus:ring-2 focus:ring-brand resize-y"
          />
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !dirty}
              className="bg-[#014D4E] hover:bg-[#00b8a6] text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={handleResetToDefault}
              className="text-sm text-ink-muted hover:text-ink underline"
            >
              Reset to default
            </button>
            {saved && <span className="text-sm text-[#00776b] font-medium">Saved. Live on the next send.</span>}
            {saveError && <span className="text-sm text-red-600">{saveError}</span>}
          </div>
        </div>

        {/* Preview */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-ink">Preview</span>
            {previewLoading && <span className="text-xs text-ink-muted">Updating…</span>}
          </div>
          <div className="border border-line rounded-lg overflow-hidden bg-[#faf9f6] h-[520px]">
            <iframe
              title="Email preview"
              srcDoc={preview}
              className="w-full h-full border-0"
              // allow-same-origin only, deliberately no allow-scripts: the
              // app's CSP (img-src 'self') can't match a fully-sandboxed
              // frame's opaque origin, so same-origin images (the header
              // icon, byline photos) silently fail to paint without this.
              // Scripts stay blocked either way since edited HTML is never
              // meant to execute, and same-origin without script execution
              // can't be used to escape the sandbox.
              sandbox="allow-same-origin"
            />
          </div>
          <p className="text-xs text-ink-muted">
            Rendered with sample data inside the real shared header and footer. Some templates add
            extra elements on top of this (like a CTA button) that aren&rsquo;t shown here.
          </p>
        </div>
      </div>

      {/* Version history */}
      <div className="mt-8 border-t border-line pt-6">
        <button
          onClick={() => setShowVersions(v => !v)}
          className="text-sm font-semibold text-ink hover:text-brand"
        >
          {showVersions ? 'Hide' : 'Show'} version history ({data.versions.length})
        </button>
        {showVersions && (
          <div className="mt-4 flex flex-col gap-2">
            {data.versions.length === 0 && (
              <p className="text-sm text-ink-muted">No saved versions yet. This template is still using its default.</p>
            )}
            {data.versions.map((v, i) => (
              <div key={v.id} className="flex items-center justify-between bg-card border border-line rounded-lg px-4 py-2.5">
                <div>
                  <span className="text-sm text-ink">{formatDate(v.createdAt)}</span>
                  {i === 0 && <span className="ml-2 text-xs bg-fill-dim text-ink-muted px-2 py-0.5 rounded-full">Current</span>}
                </div>
                {i !== 0 && (
                  <button
                    onClick={() => handleRestore(v.id)}
                    disabled={restoring === v.id}
                    className="text-sm text-brand hover:underline disabled:opacity-40"
                  >
                    {restoring === v.id ? 'Restoring…' : 'Restore this version'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
