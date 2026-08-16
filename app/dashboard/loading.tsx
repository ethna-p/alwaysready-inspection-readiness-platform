/**
 * Dashboard loading skeleton — shown during in-app navigation to /dashboard.
 * Matches the approximate layout of the At a Glance section.
 */
export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      {/* Heading */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="h-7 w-52 bg-fill-dim rounded mb-2" />
          <div className="h-4 w-36 bg-fill-dim rounded" />
        </div>
        <div className="h-10 w-36 bg-fill-dim rounded-lg" />
      </div>

      {/* CQC card */}
      <div className="bg-card rounded-2xl border border-line p-5 mb-6 h-28" />

      {/* Overall readiness */}
      <div className="bg-card rounded-2xl border border-line p-6 mb-8 h-32" />

      {/* KQ breakdown grid */}
      <div className="h-6 w-48 bg-fill-dim rounded mb-4" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bg-card rounded-xl border border-line h-36" />
        ))}
      </div>
    </div>
  )
}
