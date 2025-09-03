'use client';

import { useEffect, useState } from 'react';

export default function Countdown({ target }: { target: number }) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const ms = Math.max(0, target - now);
      setLeft(Math.floor(ms / 1000)); // floor ลด off-by-one
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  if (left === null) return <span aria-busy="true">--</span>;

  const s = left % 60;
  const m = Math.floor(left / 60) % 60;
  const h = Math.floor(left / 3600) % 24;
  const d = Math.floor(left / 86400);

  return (
    <div className="flex gap-4">
      <Box label="D" value={d} />
      <Box label="H" value={h} />
      <Box label="M" value={m} />
      <Box label="S" value={s} />
    </div>
  );
}

function Box({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-slate-800 px-4 py-3 bg-slate-900/60">
      <span className="text-4xl font-bold tabular-nums">{value}</span>
      <span className="text-xs text-slate-400">{label}</span>
    </div>
  );
}
