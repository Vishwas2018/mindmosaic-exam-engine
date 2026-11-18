export default function PracticeStudioLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading Practice Studio"
      className="space-y-8 animate-pulse"
    >
      <div className="h-40 rounded-3xl border border-mm-line bg-white p-6 shadow-xs" />
      <div className="grid gap-8 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="h-32 rounded-2xl border border-mm-line bg-white p-6 shadow-xs" />
          <div className="h-44 rounded-2xl border border-mm-line bg-white p-6 shadow-xs" />
        </div>
        <div className="h-80 rounded-2xl border border-mm-line bg-white p-6 shadow-xs" />
      </div>
    </div>
  );
}
