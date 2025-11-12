// components/dashboard/HourlyChart.tsx
"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";

type Props = {
  data: { hourUtc: string; pointsEarned: number }[];
};

function formatHH(hourIso: string) {
  const d = new Date(hourIso);
  // แสดงชั่วโมงแบบ 00–23 (ตาม UTC เพื่อแมตช์ข้อมูล)
  return d.getUTCHours().toString().padStart(2, "0") + ":00";
}

export default function HourlyChart({ data }: Props) {
  // map ให้ recharts ใช้ key เดิม ๆ
  const rows = data.map((r) => ({
    hour: formatHH(r.hourUtc),
    points: r.pointsEarned,
  }));

  const max = rows.reduce((m, r) => Math.max(m, r.points), 0);

  return (
    <div className="w-full h-72 rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-2 text-sm font-medium text-gray-600">
        Hourly Points (UTC)
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopOpacity={0.35} />
              <stop offset="95%" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="hour" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <ReferenceLine y={0} />
          <Area
            type="monotone"
            dataKey="points"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#g)"
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="mt-2 text-xs text-gray-500">
        Peak: {max.toLocaleString()} pts
      </div>
    </div>
  );
}
