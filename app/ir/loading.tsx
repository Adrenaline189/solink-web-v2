// app/ir/loading.tsx
export default function IRLoading() {
  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="h-6 w-56 rounded-full bg-slate-900/40 animate-pulse" />
        <div className="h-10 w-2/3 rounded-2xl bg-slate-900/40 animate-pulse" />
        <div className="h-4 w-1/2 rounded-2xl bg-slate-900/40 animate-pulse" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-3xl border border-slate-800 bg-slate-900/40 animate-pulse" />
          ))}
        </div>

        <div className="h-44 rounded-[28px] border border-slate-800 bg-slate-900/40 animate-pulse" />
        <div className="h-44 rounded-[28px] border border-slate-800 bg-slate-900/40 animate-pulse" />
      </div>
    </div>
  );
}
