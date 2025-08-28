// app/ir/loading.tsx
export default function IRLoading() {
  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="h-8 w-1/3 rounded-xl bg-slate-900/40 animate-pulse" />
        <div className="h-4 w-1/2 rounded-xl bg-slate-900/40 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-900/40 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
