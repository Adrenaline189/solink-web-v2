// components/SectionTitle.tsx
import React from "react";

export default function SectionTitle({
  title,
  subtitle,
  className = "",
}: {
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={`mb-4 ${className}`}>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {subtitle ? (
        <p className="mt-1 text-slate-400 text-sm">{subtitle}</p>
      ) : null}
    </div>
  );
}
