// components/charts/HourlyPoints.tsx
"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { HourlyPoint } from "../../types/dashboard";
import { formatInTZ } from "../../lib/time";
import { bandwidthLabel, formatBandwidth } from "../../lib/units";
import type { Preferences } from "../../lib/prefs";

type Units = Preferences["units"];

type Props = {
  data: HourlyPoint[] | null | undefined;
  units: Units;
  tz: string;
};

// ข้อมูลที่จะใช้กับกราฟ: เพิ่ม label (string) สำหรับแกน X
type HourlyRow = HourlyPoint & { label: string };

function numberFmt(n: number) {
  try {
    return n.toLocaleString();
  } catch {
    return String(n);
  }
}

export default function HourlyPoints({ data, units, tz }: Props) {
  const cooked: HourlyRow[] = useMemo(() => {
    const arr = Array.isArray(data) ? data : [];
    return arr.map((d) => {
      const label = d.ts
        ? formatInTZ(d.ts, tz, { hour: "2-digit", minute: "2-digit" })
        : d.time ?? "";
      return { ...d, label };
    });
  }, [data, tz]);

  if (!cooked.length) {
    return (
      <div className="h-64 rounded-xl border border-slate-800 bg-slate-900/40 animate-pulse" />
    );
    }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={cooked}>
          <defs>
            <linearGradient id="pts" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
          <XAxis dataKey="label" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" tickFormatter={(v) => numberFmt(v as number)} />
          <Tooltip
            contentStyle={{ background: "#0f172a", border: "1px solid #1f2937", color: "white" }}
            formatter={(value: any, name: string, p: any) => {
              if (name === "points") {
                const out = numberFmt(Number(value));
                const mbps = p?.payload?.mbps;
                if (typeof mbps === "number") {
                  const bw = formatBandwidth(mbps, units);
                  return [out, `Points • Bandwidth: ${bw}`];
                }
                return [out, "Points"];
              }
              return [value, name];
            }}
            labelFormatter={(lbl) => `Time: ${lbl} (${tz})`}
          />
          <Area
            type="monotone"
            dataKey="points"
            stroke="#22d3ee"
            fillOpacity={1}
            fill="url(#pts)"
            strokeWidth={2}
            name="points"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* ทำตัวเลขแกนให้เล็กลงตามที่ขอ */}
      <style jsx global>{`
        .recharts-cartesian-axis-tick-value tspan { font-size: 11px }
        .recharts-tooltip-wrapper { font-size: 12px }
      `}</style>

      <div className="mt-2 text-[11px] text-slate-400">
        Bandwidth unit: {bandwidthLabel(units)}
      </div>
    </div>
  );
}
