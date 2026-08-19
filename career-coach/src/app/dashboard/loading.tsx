export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-5" aria-busy="true" aria-label="Loading placement mission">
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="panel h-48 rounded-[1.5rem] lg:col-span-2" />
        <div className="panel h-48 rounded-[1.5rem]" />
      </div>
      <div className="panel h-64 rounded-[1.5rem]" />
      <div className="grid gap-5 md:grid-cols-2">
        <div className="panel h-40 rounded-[1.5rem]" />
        <div className="panel h-40 rounded-[1.5rem]" />
      </div>
    </div>
  );
}
