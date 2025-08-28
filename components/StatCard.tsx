export function StatCard({
  label,
  value,
  footnote,
}: {
  label: string;
  value: string;
  footnote?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
      <div className="text-sm text-slate-400">{label}</div>
      <div className="mt-2 text-3xl font-bold tracking-tight text-white">{value}</div>
      {footnote ? <div className="mt-2 text-xs text-slate-400">{footnote}</div> : null}
    </div>
  );
}
