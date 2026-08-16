/**
 * SiteFooter — required on every page per the project brief.
 * Legal copyright + CQC disclaimer (verbatim from PROJECT_BRIEF.md).
 */

const badges = [
  {
    label: 'GDPR-compliant by design',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    label: 'Data encrypted at rest',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    label: 'UK-based, human support',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    label: 'Rolling monthly contract',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    label: 'Built for the CQC assessment framework',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
]

export default function SiteFooter() {
  return (
    <footer className="border-t border-line bg-canvas px-6 py-6 text-center mt-auto print:hidden">
      <p className="text-xs text-ink">
        © 2026 AlwaysReady is a brand of Parker Digital &amp; Print Services. |
        82A James Carter Road, Mildenhall, IP28 7DE
      </p>
      <p className="text-xs text-ink mt-1">
        Our tools are designed to support providers in preparing for CQC inspection. They do not constitute official CQC guidance and do not guarantee any particular inspection outcome.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2">
        {badges.map(b => (
          <span key={b.label} className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
            {b.icon}
            {b.label}
          </span>
        ))}
      </div>
    </footer>
  )
}
