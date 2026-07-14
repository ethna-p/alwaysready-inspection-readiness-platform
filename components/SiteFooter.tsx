/**
 * SiteFooter — required on every page per the project brief.
 * Legal copyright + CQC disclaimer (verbatim from PROJECT_BRIEF.md).
 */
export default function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 bg-[#faf9f6] px-6 py-6 text-center mt-auto">
      <p className="text-xs text-[#1a1a1a]">
        © 2026 AlwaysReady is a brand of Parker Digital &amp; Print Services Ltd. |
        Registered Office: 82A James Carter Road, Mildenhall, IP28 7DE
      </p>
      <p className="text-xs text-[#1a1a1a] mt-1 max-w-2xl mx-auto">
        Our tools are designed to support providers in preparing for CQC inspection.
        They do not constitute official CQC guidance and do not guarantee any
        particular inspection outcome.
      </p>
    </footer>
  )
}
