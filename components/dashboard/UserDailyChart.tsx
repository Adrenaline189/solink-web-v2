"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function UserDailyChart({ range }: { range: string }) {
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [rawData, setRawData] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/dashboard/user-daily?range=${range}`, { credentials: "include" })
      .then(r => r.json())
      .then(json => {
        const data = json.items ?? json.days ?? [];
        setRawData(data);
        setTotal(data.reduce((s: number, x: any) => s + Number(x.points ?? x.pointsEarned ?? 0), 0));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [range]);

  if (loading) return <div className="text-xs text-slate-400">Loading...</div>;
  if (!rawData.length) return <div className="text-xs text-slate-400">No data</div>;

  const allPoints = rawData.map((b: any) => Number(b.points ?? b.pointsEarned ?? 0));
  const maxPoints = Math.max(...allPoints, 1);
  const chartData = rawData.map((b: any) => ({
    label: b.label ?? "",
    points: Number(b.points ?? b.pointsEarned ?? 0),
  }));

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs text-slate-400">User: {total.toLocaleString()} pts ({range})</div>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} />
            <YAxis allowDecimals={false} domain={[0, maxPoints * 1.2]} />
            <Tooltip
              cursor={{ fill: "rgba(148,163,184,0.2)" }}
              contentStyle={{ backgroundColor: "rgba(15,23,42,0.96)", border: "1px solid rgba(148,163,184,0.5)", borderRadius: 12, padding: "8px 10px" }}
              labelStyle={{ color: "#e5e7eb", fontSize: 12 }}
              formatter={(value: number) => [`${value.toLocaleString()} pts`, "User"]}
            />
            <Bar dataKey="points" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
