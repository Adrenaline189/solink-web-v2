export default function SectionTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8">
      {eyebrow ? (
        <div className="text-xs uppercase tracking-wider text-slate-400">{eyebrow}</div>
      ) : null}
      <h2 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h2>
      {subtitle ? <p className="mt-2 text-slate-300">{subtitle}</p> : null}
    </div>
  );
}