"use client";

import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

type SystemHourRow = {
  hourUtc: string;
  pointsEarned: number;
};

type DashboardRange = "today" | "yesterday" | "last7d" | "last30d";

type SystemMetricsResp = {
  ok: boolean;
  range: DashboardRange;
  startUtc: string;
  endUtc: string;
  totalPoints: number;
  hourly: SystemHourRow[];
};

type ChartPoint = {
  label: string;
  points: number;
};

export default function SystemMetricsChart() {
  const [data, setData] = useState<ChartPoint[]>([]);
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/dashboard/metrics?range=today", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json: SystemMetricsResp = await res.json();
        if (!json.ok) {
          throw new Error(json as any);
        }

        if (cancelled) return;

        setTotalPoints(json.totalPoints);

        const points: ChartPoint[] = json.hourly.map((row) => {
          const d = new Date(row.hourUtc);

          // label: 14:00, 15:00 แบบ UTC (ถ้าอยากใช้ local ค่อยเปลี่ยนทีหลัง)
          const hh = String(d.getUTCHours()).padStart(2, "0");
          const mm = String(d.getUTCMinutes()).padStart(2, "0");

          return {
            label: `${hh}:${mm}`,
            points: row.pointsEarned ?? 0,
          };
        });

        setData(points);
      } catch (e: any) {
        console.error("load metrics error:", e);
        if (!cancelled) {
          setError("Failed to load system metrics");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    // ถ้าอยาก auto refresh ทุก ๆ 60s ก็เพิ่มตรงนี้ได้ในอนาคต
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="w-full rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="text-sm text-slate-400">Loading system metrics…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full rounded-xl border border-red-500/40 bg-red-950/40 p-4">
        <div className="text-sm text-red-300">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 p-4 md:p-6 flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-200">
            System Points (Today, UTC)
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            รวมแต้มจาก MetricsHourly ที่ userId = &quot;system&quot;
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">Total</div>
          <div className="text-xl font-semibold text-sky-300">
            {totalPoints.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="h-56 w-full">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-slate-500">
            ยังไม่มีข้อมูลในวันนี้
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                tickMargin={8}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                tickMargin={4}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#020617",
                  border: "1px solid #1e293b",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "#e5e7eb" }}
                itemStyle={{ color: "#7dd3fc" }}
              />
              <Line
                type="monotone"
                dataKey="points"
                dot={false}
                strokeWidth={2}
                // สี default ของ Recharts ก็ได้ ถ้าไม่อยาก fix
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
