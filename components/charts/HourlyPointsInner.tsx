// components/charts/HourlyPointsInner.tsx
"use client";

import { useId } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

type Point = { time: string; points: number; mbps: number };

export default function HourlyPointsInner({ data }: { data: Point[] }) {
  const gradId = useId(); // กันชน ID ซ้ำกับหน้าอื่น
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`${gradId}-pts`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopOpacity={0.8} stopColor="#22d3ee" />
              <stop offset="95%" stopOpacity={0.1} stopColor="#6366f1" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
          <XAxis dataKey="time" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip
            contentStyle={{
              background: "#0f172a",
              border: "1px solid #1f2937",
              color: "white"
            }}
          />
          <Area
            type="monotone"
            dataKey="points"
            stroke="#22d3ee"
            fill={`url(#${gradId}-pts)`}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
