"use client";

import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function SystemDailyChart({ range }: { range: string }) {
  const [buckets, setBuckets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetch(`/api/dashboard/system-daily?range=${range}`, { credentials: "include" })
      .then(r => r.json())
      .then(json => {
        const series = json.series ?? json.days ?? [];
        setBuckets(series.map((b: any) => ({ label: b.label ?? "", points: b.points ?? b.pointsEarned ?? 0 })));
        setTotal(json.todayTotal ?? series.reduce((s: number, x: any) => s + (x.points ?? x.pointsEarned ?? 0), 0));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [range]);

  if (loading) return <div className="text-xs text-slate-400">Loading...</div>;
  if (!buckets.length) return <div className="text-xs text-slate-400">No data</div>;
  const maxPoints = Math.max(...buckets.map((b: any) => b.points), 1);

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs text-slate-400">System: {total.toLocaleString()} pts ({range})</div>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={buckets} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="sysGD" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} />
            <YAxis allowDecimals={false} domain={[0, maxPoints * 1.2]} />
            <Tooltip cursor={false} contentStyle={{ backgroundColor: "rgba(15,23,42,0.96)", border: "1px solid rgba(148,163,184,0.5)", borderRadius: 12, padding: "8px 10px" }} labelStyle={{ color: "#e5e7eb", fontSize: 12 }} itemStyle={{ color: "#22c55e", fontSize: 12 }} formatter={(v: number) => [`${v.toLocaleString()} pts`, "System"]} />
            <Area type="monotone" dataKey="points" stroke="#22c55e" strokeWidth={2} fill="url(#sysGD)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
