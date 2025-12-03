// app/dashboard/_components/UserDailyGraph.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { motion } from "framer-motion";

type DailyMetric = {
  dayUtc: string;
  pointsEarned: number;
  uptimePct: number;
  avgBandwidthMbps: number;
  qfScore: number;
  trustScore: number;
};

type ApiResponse = {
  ok: boolean;
  userId: string;
  days: number;
  data: DailyMetric[];
  error?: string;
};

type FocusMetric = "points" | "uptime" | "bandwidth";

const formatDateLabel = (iso: string) => {
  const d = new Date(iso);
  // แสดงเป็นรูปแบบสั้น ๆ (เช่น 16 Nov)
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

export default function UserDailyGraph() {
  const [data, setData] = useState<DailyMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [focus, setFocus] = useState<FocusMetric>("points");

  useEffect(() => {
    let aborted = false;

    const load = async () => {
      try {
        setLoading(true);
        setErr(null);

        const res = await fetch(
          "/api/dashboard/daily?userId=system&days=30",
          {
            method: "GET",
          }
        );
        const json: ApiResponse = await res.json();

        if (!json.ok) {
          throw new Error(json.error || "Failed to load");
        }

        if (!aborted) {
          setData(json.data || []);
        }
      } catch (e: any) {
        if (!aborted) {
          setErr(e?.message || "Failed to load");
        }
      } finally {
        if (!aborted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      aborted = true;
    };
  }, []);

  const prepared = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        dayLabel: formatDateLabel(d.dayUtc),
      })),
    [data]
  );

  const title = useMemo(() => {
    if (focus === "points") return "Daily Points Earned";
    if (focus === "uptime") return "Daily Uptime (%)";
    return "Daily Avg Bandwidth (Mbps)";
  }, [focus]);

  return (
    <motion.section
      className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 p-4 md:p-6 shadow-lg"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">
            User Daily Graph
          </h2>
          <p className="text-xs text-slate-400">
            Last 30 days of points, uptime and bandwidth per day.
          </p>
        </div>

        <div className="inline-flex overflow-hidden rounded-full border border-slate-700 bg-slate-900 text-xs">
          <button
            type="button"
            onClick={() => setFocus("points")}
            className={`px-3 py-1 ${
              focus === "points"
                ? "bg-slate-100 text-slate-900"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            Points
          </button>
          <button
            type="button"
            onClick={() => setFocus("uptime")}
            className={`px-3 py-1 ${
              focus === "uptime"
                ? "bg-slate-100 text-slate-900"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            Uptime %
          </button>
          <button
            type="button"
            onClick={() => setFocus("bandwidth")}
            className={`px-3 py-1 ${
              focus === "bandwidth"
                ? "bg-slate-100 text-slate-900"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            Bandwidth
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex h-40 items-center justify-center text-sm text-slate-400">
          Loading daily metrics...
        </div>
      )}

      {!loading && err && (
        <div className="flex h-40 items-center justify-center text-sm text-red-400">
          {err}
        </div>
      )}

      {!loading && !err && prepared.length === 0 && (
        <div className="flex h-40 items-center justify-center text-sm text-slate-400">
          No daily data yet.
        </div>
      )}

      {!loading && !err && prepared.length > 0 && (
        <div className="h-64 w-full md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={prepared}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="dayLabel" tick={{ fontSize: 10 }} />
              <YAxis
                tick={{ fontSize: 10 }}
                domain={focus === "uptime" ? [0, 100] : ["auto", "auto"]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#020617",
                  border: "1px solid #1e293b",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend />
              {focus === "points" && (
                <Line
                  type="monotone"
                  dataKey="pointsEarned"
                  name="Points"
                  strokeWidth={2}
                  dot={false}
                />
              )}
              {focus === "uptime" && (
                <Line
                  type="monotone"
                  dataKey="uptimePct"
                  name="Uptime %"
                  strokeWidth={2}
                  dot={false}
                />
              )}
              {focus === "bandwidth" && (
                <Line
                  type="monotone"
                  dataKey="avgBandwidthMbps"
                  name="Bandwidth (Mbps)"
                  strokeWidth={2}
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <p className="mt-3 text-[11px] text-slate-500">
        Data source: MetricsDaily (points, uptime, bandwidth aggregated per day).
      </p>
    </motion.section>
  );
}
