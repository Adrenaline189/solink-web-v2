"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type ChartBucket = {
  label: string;
  points: number;
};

export default function SystemDailyChart({ range }: { range: string }) {
  const [buckets, setBuckets] = useState<ChartBucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`/api/dashboard/system-daily?range=${range}`, { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        if (!json.ok) {
          setError("API error");
          setLoading(false);
          return;
        }

        // Use series array from API
        const series: ChartBucket[] = (json.series ?? json.days ?? json.daily ?? []).map(
          (b: any) => ({
            label: String(b.label ?? ""),
            points: Number(b.points ?? b.pointsEarned ?? 0),
          })
        );

        // Sort by label ASC (just in case)
        series.sort((a, b) => a.label.localeCompare(b.label));

        const totalPoints = json.todayTotal ?? series.reduce((s: number, x: ChartBucket) => s + x.points, 0);

        setBuckets(series);
        setTotal(totalPoints);
        setLoading(false);
      })
      .catch((e) => {
        setError(String(e?.message ?? "fetch failed"));
        setLoading(false);
      });
  }, [range]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500 text-sm">
        Loading…
      </div>
    );
  }

  if (error) {
    return <div className="text-rose-400 text-sm">Error: {error}</div>;
  }

  if (!buckets.length) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500 text-sm">
        No data
      </div>
    );
  }

  // Y-axis: use max data value, min 1 so we never get domain [0, 0]
  const maxPoints = Math.max(...buckets.map((b) => b.points), 1);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={buckets}
        margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10 }}
          interval={0}
          angle={-30}
          textAnchor="end"
          height={40}
        />
        <YAxis
          allowDecimals={false}
          domain={[0, Math.ceil(maxPoints * 1.2)]}
          hide
        />
        <Tooltip
          cursor={{ fill: "rgba(148,163,184,0.15)" }}
          contentStyle={{
            backgroundColor: "rgba(15,23,42,0.95)",
            border: "1px solid rgba(148,163,184,0.4)",
            borderRadius: 10,
            padding: "6px 10px",
          }}
          labelStyle={{ color: "#e5e7eb", fontSize: 11, marginBottom: 4 }}
          itemStyle={{ color: "#22c55e", fontSize: 12 }}
          formatter={(value: number) => [`${value.toLocaleString()} pts`, "System"]}
          labelFormatter={(label) => `Day: ${label}`}
        />
        <Bar
          dataKey="points"
          fill="#22c55e"
          radius={[3, 3, 0, 0]}
          maxBarSize={40}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
