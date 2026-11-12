export default function LearningHubLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading Learning Hub"
      className="space-y-8 animate-pulse"
    >
      {/* Hero skeleton */}
      <div className="h-44 rounded-3xl border border-mm-line bg-white p-6 shadow-xs" />

      {/* Filter and year controls skeleton */}
      <div className="h-24 rounded-2xl border border-mm-line bg-white p-5 shadow-xs" />

      {/* Strand cards skeleton */}
      <div className="space-y-4">
        <div className="h-28 rounded-2xl border border-mm-line bg-white p-5 shadow-xs" />
        <div className="h-28 rounded-2xl border border-mm-line bg-white p-5 shadow-xs" />
        <div className="h-28 rounded-2xl border border-mm-line bg-white p-5 shadow-xs" />
      </div>
    </div>
  );
}
