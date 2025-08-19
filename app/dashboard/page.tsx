"use client";
export const dynamic = 'force-dynamic';
import { Suspense } from 'react';
export const dynamic = 'force-dynamic';

import React, { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import {
  Wallet,
  Link2,
  Gauge,
  Award,
  Activity,
  Cloud,
  TrendingUp,
} from "lucide-react";

import { useLang } from "@/lib/useLang";
import { t } from "@/lib/i18n";

/** ----------------------------------------------------------------
 *  Mock data (ปลอดภัยต่อการ build และ demo)
 *  ---------------------------------------------------------------- */
const hourly = [
  { time: "09:00", points: 20, mbps: 0.8 },
  { time: "10:00", points: 65, mbps: 1.1 },
  { time: "11:00", points: 120, mbps: 1.3 },
  { time: "12:00", points: 160, mbps: 1.8 },
  { time: "13:00", points: 200, mbps: 2.0 },
  { time: "14:00", points: 240, mbps: 2.2 },
  { time: "15:00", points: 300, mbps: 2.6 },
];

type Tx = { ts: string; type: string; amount: string; note: string };
const txData: Tx[] = [
  { ts: "2025-08-15 14:30", type: "Accrual", amount: "+120 pts", note: "Uptime slot bonus" },
  { ts: "2025-08-15 13:10", type: "Convert", amount: "-1,000 pts → +1 SLK", note: "Conversion" },
  { ts: "2025-08-15 12:55", type: "Referral", amount: "+50 pts", note: "Invite accepted" },
  { ts: "2025-08-15 11:05", type: "Accrual", amount: "+80 pts", note: "Usage accrual" },
];

/** ----------------------------------------------------------------
 *  Page
 *  ---------------------------------------------------------------- */
function DashboardInner() {
  const [lang] = useLang();
  const [copied, setCopied] = useState(false);

  const refLink = useMemo(
    () => "https://solink.network/r/your-id",
    []
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(refLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (_) {
      // no-op
    }
  };

  const nodeStatus = "● " + t(lang, "status.connected"); // mock: connected

  return (
    <div className="min-h-screen text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t(lang, "dashboard.title")}
            </h1>
            <p className="text-slate-400">
              {t(lang, "dashboard.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button className="rounded-2xl px-5">
              {t(lang, "dashboard.connectWallet")} <Wallet className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="secondary" className="rounded-2xl px-5">
              {t(lang, "dashboard.startSharing")} <Link2 className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPI
            title={t(lang, "dashboard.kpi.todayPoints")}
            value="320"
            sub={`${t(lang, "dashboard.kpi.dailyCap")} 2,000`}
            icon={<Award className="h-5 w-5" />}
          />
          <KPI
            title={t(lang, "dashboard.kpi.totalPoints")}
            value="12,450"
            sub="≈ 12.45 SLK"
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <KPI
            title={t(lang, "dashboard.kpi.uptimeToday")}
            value="6 h"
            sub={t(lang, "dashboard.kpi.targetUptime")}
            icon={<Activity className="h-5 w-5" />}
          />
          <KPI
            title={t(lang, "dashboard.kpi.avgBandwidth")}
            value="2.1 Mbps"
            sub={t(lang, "dashboard.kpi.latest15m")}
            icon={<Cloud className="h-5 w-5" />}
          />
        </div>

        {/* Charts + Quality Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <Card className="col-span-2">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Gauge className="h-4 w-4" /> {t(lang, "dashboard.chart.hourlyPoints")}
                </h3>
                <span className="text-xs text-slate-400">{t(lang, "filters.utc")}</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hourly}>
                    <defs>
                      <linearGradient id="pts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
                    <XAxis dataKey="time" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        background: "#0f172a",
                        border: "1px solid #1f2937",
                        color: "white",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="points"
                      stroke="#22d3ee"
                      fill="url(#pts)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h3 className="text-lg font-semibold mb-3">
                {t(lang, "dashboard.panel.qualityAndTrust")}
              </h3>
              <Meter
                label={t(lang, "dashboard.meter.qualityFactor")}
                value={82}
                color="from-cyan-400 to-indigo-500"
              />
              <div className="h-3" />
              <Meter
                label={t(lang, "dashboard.meter.trustScore")}
                value={74}
                color="from-emerald-400 to-cyan-400"
              />
              <div className="text-sm text-slate-400 mt-2">
                {t(lang, "dashboard.note.qf")}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters (simple) */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{t(lang, "filters.range")}:</span>
            <FilterPill>{t(lang, "filters.today")}</FilterPill>
            <FilterPill>{t(lang, "filters.7d")}</FilterPill>
            <FilterPill>{t(lang, "filters.30d")}</FilterPill>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{t(lang, "filters.tz")}:</span>
            <span className="text-xs text-slate-300">{t(lang, "filters.utc")}</span>
          </div>
        </div>

        {/* Referral + Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Referral */}
          <Card className="lg:col-span-2">
            <CardContent className="p-5">
              <h3 className="text-lg font-semibold">{t(lang, "ref.title")}</h3>
              <p className="text-slate-400 mb-4">{t(lang, "ref.subtitle")}</p>

              <label className="text-sm text-slate-400">{t(lang, "ref.yourLink")}</label>
              <div className="mt-2 flex flex-col sm:flex-row gap-2">
                <input
                  value={refLink}
                  readOnly
                  className="w-full rounded-xl bg-slate-900/60 border border-slate-700 px-3 py-2 text-sm text-slate-200"
                />
                <div className="flex gap-2">
                  <Button onClick={copy} className="rounded-xl px-4">
                    {t(lang, copied ? "ref.copied" : "ref.copy")}
                  </Button>
                  <Button variant="secondary" className="rounded-xl px-4">
                    {t(lang, "ref.share")}
                  </Button>
                </div>
              </div>

              <h4 className="text-sm font-semibold mt-5 mb-1">{t(lang, "ref.howItWorks")}</h4>
              <ul className="list-disc pl-5 text-slate-400 text-sm">
                <li>{t(lang, "ref.rule1")}</li>
                <li>{t(lang, "ref.rule2")}</li>
              </ul>

              <h4 className="text-sm font-semibold mt-5 mb-2">{t(lang, "ref.stats")}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Stat label={t(lang, "ref.invites")} value="8" />
                <Stat label={t(lang, "ref.accepted")} value="5" />
                <Stat label={t(lang, "ref.pointsFromRef")} value="+420" />
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardContent className="p-5">
              <h3 className="text-lg font-semibold mb-3">{t(lang, "status.title")}</h3>
              <StatusItem label={t(lang, "status.node")} value={nodeStatus} positive />
              <StatusItem label={t(lang, "status.region")} value="SG1" />
              <StatusItem label={t(lang, "status.ip")} value="203.0.113.42" />
              <StatusItem label={t(lang, "status.version")} value="v0.4.2" />
              <div className="mt-3 flex gap-2">
                <Button size="sm" className="rounded-xl">{t(lang, "actions.details")}</Button>
                <Button size="sm" variant="secondary" className="rounded-xl">{t(lang, "actions.retry")}</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardContent className="p-5">
            <h3 className="text-lg font-semibold mb-3">{t(lang, "dashboard.table.recentTx")}</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400">
                    <th className="py-2 pr-4">{t(lang, "dashboard.table.time")}</th>
                    <th className="py-2 pr-4">{t(lang, "dashboard.table.type")}</th>
                    <th className="py-2 pr-4">{t(lang, "dashboard.table.amount")}</th>
                    <th className="py-2 pr-4">{t(lang, "dashboard.table.note")}</th>
                  </tr>
                </thead>
                <tbody>
                  {txData.map((r, i) => (
                    <tr key={i} className="border-t border-slate-800">
                      <td className="py-2 pr-4 whitespace-nowrap">{r.ts}</td>
                      <td className="py-2 pr-4">{r.type}</td>
                      <td className="py-2 pr-4 font-semibold">{r.amount}</td>
                      <td className="py-2 pr-4 text-slate-400">{r.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <footer className="text-xs text-slate-500 mt-8">
          © 2025 Solink • {t(lang, "dashboard.footer.demo")}
        </footer>
      </div>
    </div>
  );
}

/** ----------------------------------------------------------------
 *  Small UI helpers (ในไฟล์เดียวเพื่อใช้งานง่าย)
 *  ---------------------------------------------------------------- */
function KPI({
  title,
  value,
  sub,
  icon,
}: {
  title: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-xs uppercase tracking-wide">
              {title}
            </div>
            <div className="text-2xl font-bold mt-1">{value}</div>
            {sub && <div className="text-slate-400 text-xs mt-1">{sub}</div>}
          </div>
          <div className="opacity-70">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function Meter({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-400">{value}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function StatusItem({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-800 last:border-none">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className={`text-sm ${positive ? "text-emerald-400" : "text-slate-300"}`}>{value}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 p-3">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function FilterPill({ children }: { children: React.ReactNode }) {
  return (
    <button className="px-3 py-1 rounded-xl text-xs bg-slate-900/60 border border-slate-700 hover:bg-slate-800">
      {children}
    </button>
  );
}


export default function Dashboard() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-400">Loading…</div>}>
      <DashboardInner />
    </Suspense>
  );
}
