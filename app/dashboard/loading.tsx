// app/dashboard/loading.tsx
export default function DashboardLoading() {
  return (
    <div className="p-6 animate-pulse">
      <div className="mx-auto max-w-7xl">
        <div className="h-8 w-52 rounded bg-slate-800" />
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl border border-slate-800 bg-slate-900/40" />
          ))}
        </div>
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="h-80 rounded-xl border border-slate-800 bg-slate-900/40 lg:col-span-2" />
          <div className="h-80 rounded-xl border border-slate-800 bg-slate-900/40" />
        </div>
      </div>
    </div>
  );
}
