/**
 * SiteFooter — required on every page per the project brief.
 * Legal copyright + CQC disclaimer (verbatim from PROJECT_BRIEF.md).
 */
export default function SiteFooter() {
  return (
    <footer className="border-t border-line bg-canvas px-6 py-6 text-center mt-auto print:hidden">
      <p className="text-xs text-ink">
        © 2026 AlwaysReady is a brand of Parker Digital &amp; Print Services Ltd. |
        Registered Office: 82A James Carter Road, Mildenhall, IP28 7DE
      </p>
      <p className="text-xs text-ink mt-1 max-w-2xl mx-auto">
        Our tools are designed to support providers in preparing for CQC inspection.
        They do not constitute official CQC guidance and do not guarantee any
        particular inspection outcome.
      </p>
    </footer>
  )
}
