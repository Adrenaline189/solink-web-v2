"use client";
export const dynamic = 'force-dynamic';
import React, { useMemo, useState, Suspense } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

import {
  Wallet, Link2, Gauge, Award, Activity, Cloud, TrendingUp,
} from "lucide-react";

import { useLang } from "@/lib/useLang";
import { t } from "@/lib/i18n";

/** translator with fallback:
 *  ถ้า key ไม่มีใน locales จะใช้ fallback ทันที (EN/TH)
 */
function tt(
  lang: "en" | "zh" | "ko" | "ja" | "th" | "es" | "it",
  key: string,
  enFallback: string,
  thFallback?: string
) {
  const s = t(lang, key);
  if (s && s !== key) return s;
  return lang === "th" ? (thFallback ?? enFallback) : enFallback;
}

/* ---------- demo data ---------- */
const hourly = [
  { time: "09:00", points: 20,  mbps: 0.8 },
  { time: "10:00", points: 65,  mbps: 1.1 },
  { time: "11:00", points: 120, mbps: 1.3 },
  { time: "12:00", points: 160, mbps: 1.8 },
  { time: "13:00", points: 200, mbps: 2.0 },
  { time: "14:00", points: 240, mbps: 2.2 },
  { time: "15:00", points: 300, mbps: 2.6 },
];

type Tx = { ts: string; type: string; amount: string; note: string };
const txData: Tx[] = [
  { ts: "2025-08-15 14:30", type: "Accrual",  amount: "+120 pts",             note: "Uptime slot bonus" },
  { ts: "2025-08-15 13:10", type: "Convert",  amount: "-1,000 pts → +1 SLK",  note: "Conversion" },
  { ts: "2025-08-15 12:55", type: "Referral", amount: "+50 pts",              note: "Invite accepted" },
  { ts: "2025-08-15 11:05", type: "Accrual",  amount: "+80 pts",              note: "Usage accrual" },
];

/* ---------- small UI bits ---------- */
function KPI({
  title, value, sub, icon,
}: { title: string; value: string; sub?: string; icon?: React.ReactNode }) {
  return (
    <Card className="rounded-2xl border-slate-800">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-xs uppercase tracking-wide">{title}</div>
            <div className="text-2xl font-bold mt-1">{value}</div>
            {sub && <div className="text-slate-400 text-xs mt-1">{sub}</div>}
          </div>
          <div className="opacity-70">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-400">{value}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full meter-bar`}
          data-width={value}
        />
      </div>
    </div>
  );
}

function StatusItem({
  label, value, positive,
}: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-800 last:border-none">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className={`text-sm ${positive ? "text-emerald-400" : "text-slate-300"}`}>{value}</span>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <button className="px-3 py-1 rounded-xl text-xs bg-slate-900/60 border border-slate-700 hover:bg-slate-800">
      {children}
    </button>
  );
}

/* ---------- page inner ---------- */
function DashboardInner() {
  const [lang] = useLang();

  const refLink = useMemo(() => "https://solink.network/r/your-id", []);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(refLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch { /* noop */ }
  };

  return (
    <div className="min-h-screen text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {tt(lang, "dashboard.title", "Solink Dashboard", "Solink Dashboard")}
            </h1>
            <p className="text-slate-400">
              {tt(
                lang,
                "dashboard.subtitle",
                "Demo view (mock) — not connected to database yet",
                "แสดงผลแบบสาธิต (mock) — ยังไม่เชื่อมฐานข้อมูล"
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button className="rounded-2xl px-5">
              {tt(lang, "dashboard.connectWallet", "Connect Wallet", "เชื่อมต่อกระเป๋า")}
              <Wallet className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="ghost" className="rounded-2xl px-5 border border-slate-700">
              {tt(lang, "dashboard.startSharing", "Start Sharing", "เริ่มแชร์แบนด์วิธ")}
              <Link2 className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPI
            title={tt(lang, "dashboard.kpi.todayPoints", "Points Today", "แต้มวันนี้")}
            value="320"
            sub={tt(lang, "dashboard.kpi.dailyCap", "Daily cap", "จากเพดานรายวัน") + " 2,000"}
            icon={<Award className="h-5 w-5" />}
          />
          <KPI
            title={tt(lang, "dashboard.kpi.totalPoints", "Total Points", "แต้มสะสมรวม")}
            value="12,450"
            sub="≈ 12.45 SLK"
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <KPI
            title={tt(lang, "dashboard.kpi.uptimeToday", "UPTIME Today", "UPTIME วันนี้")}
            value="6 h"
            sub={tt(lang, "dashboard.kpi.targetUptime", "Target: ≥ 8h", "เป้าหมาย: ≥ 8 ชม.")}
            icon={<Activity className="h-5 w-5" />}
          />
          <KPI
            title={tt(lang, "dashboard.kpi.avgBandwidth", "Avg Bandwidth", "แบนด์วิดธ์เฉลี่ย")}
            value="2.1 Mbps"
            sub={tt(lang, "dashboard.kpi.latest15m", "Last 15 min", "ช่วงล่าสุด: 15 นาที")}
            icon={<Cloud className="h-5 w-5" />}
          />
        </div>

        {/* Charts + QF Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <Card className="col-span-2 rounded-2xl border-slate-800">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Gauge className="h-4 w-4" /> {tt(lang, "dashboard.chart.hourlyPoints", "Hourly Points", "กราฟแต้มแบบรายชั่วโมง")}
                </h3>
                <span className="text-xs text-slate-400">{tt(lang, "filters.utc", "UTC", "UTC")}</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hourly}>
                    <defs>
                      <linearGradient id="pts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#22d3ee" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
                    <XAxis dataKey="time" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ background:"#0f172a", border:"1px solid #1f2937", color:"#fff" }}
                    />
                    <Area type="monotone" dataKey="points" stroke="#22d3ee" fill="url(#pts)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-800">
            <CardContent className="p-5">
              <h3 className="text-lg font-semibold mb-3">
                {tt(lang, "dashboard.panel.qualityAndTrust", "Quality & Trust", "คุณภาพลิงก์ (QF) และความน่าเชื่อถือ")}
              </h3>
              <Meter label="Quality Factor" value={82} />
              <Meter label="Trust Score" value={74} />
              <div className="text-sm text-slate-400 mt-2">
                {tt(
                  lang,
                  "dashboard.note.qf",
                  "Note: QF factors include latency p50, jitter and session stability",
                  "หมายเหตุ: QF พิจารณาจาก latency p50, jitter และความเสถียรของ session"
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{tt(lang, "filters.range", "Range", "ช่วงเวลา")}:</span>
            <Pill>{tt(lang, "filters.today", "Today", "วันนี้")}</Pill>
            <Pill>{tt(lang, "filters.7d", "7d", "7 วัน")}</Pill>
            <Pill>{tt(lang, "filters.30d", "30d", "30 วัน")}</Pill>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{tt(lang, "filters.tz", "Timezone", "โซนเวลา")}:</span>
            <span className="text-xs text-slate-300">{tt(lang, "filters.utc", "UTC", "UTC")}</span>
          </div>
        </div>

        {/* Referral + Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Referral */}
          <Card className="lg:col-span-2 rounded-2xl border-slate-800">
            <CardContent className="p-5">
              <h3 className="text-lg font-semibold">
                {tt(lang, "ref.title", "Invite friends, earn points", "ชวนเพื่อนแล้วรับแต้ม")}
              </h3>
              <p className="text-slate-400 mb-4">
                {tt(
                  lang,
                  "ref.subtitle",
                  "Share your referral link. Earn bonus points when friends sign up and start using.",
                  "แชร์ลิงก์แนะนำเพื่อน รับโบนัสแต้มเมื่อเพื่อนสมัครและเริ่มใช้งาน"
                )}
              </p>

              <label className="text-sm text-slate-400">{tt(lang, "ref.yourLink", "Your link", "ลิงก์แนะนำของคุณ")}</label>
              <div className="mt-2 flex flex-col sm:flex-row gap-2">
                <input
                  value={refLink}
                  readOnly
                  placeholder="https://solink.network/r/your-id"
                  className="w-full rounded-xl bg-slate-900/60 border border-slate-700 px-3 py-2 text-sm text-slate-200"
                />
                <div className="flex gap-2">
                  <Button onClick={copy} className="rounded-xl px-4">
                    {tt(lang, copied ? "ref.copied" : "ref.copy", copied ? "Copied" : "Copy", copied ? "คัดลอกแล้ว" : "คัดลอก")}
                  </Button>
                  <Button variant="secondary" className="rounded-xl px-4">
                    {tt(lang, "ref.share", "Share", "แชร์")}
                  </Button>
                </div>
              </div>

              <h4 className="text-sm font-semibold mt-5 mb-1">{tt(lang, "ref.howItWorks", "How it works", "วิธีการทำงาน")}</h4>
              <ul className="list-disc pl-5 text-slate-400 text-sm">
                <li>{tt(lang, "ref.rule1", "Earn bonus when friends sign up and start sharing bandwidth", "คุณได้รับแต้มโบนัสเมื่อเพื่อนสมัครและเริ่มแชร์แบนด์วิธ")}</li>
                <li>{tt(lang, "ref.rule2", "Higher quality/uptime increases referral multipliers", "คุณภาพ/เวลาออนไลน์สูง เพิ่มคูณแต้มจากการแนะนำ")}</li>
              </ul>

              <h4 className="text-sm font-semibold mt-5 mb-2">{tt(lang, "ref.stats", "Referral stats", "สถิติการแนะนำ")}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <SimpleStat label={tt(lang, "ref.invites", "Invites", "จำนวนเชิญ")} value="8" />
                <SimpleStat label={tt(lang, "ref.accepted", "Accepted", "ยืนยันแล้ว")} value="5" />
                <SimpleStat label={tt(lang, "ref.pointsFromRef", "Points from referrals", "แต้มจากการแนะนำ")} value="+420" />
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card className="rounded-2xl border-slate-800">
            <CardContent className="p-5">
              <h3 className="text-lg font-semibold mb-3">{tt(lang, "status.title", "System Status", "สถานะระบบ")}</h3>
              <StatusItem label={tt(lang, "status.node", "Node", "โหนด")} value={"● " + tt(lang, "status.connected","Connected","เชื่อมต่อแล้ว")} positive />
              <StatusItem label={tt(lang, "status.region", "Region", "ภูมิภาค")} value="SG1" />
              <StatusItem label={tt(lang, "status.ip", "IP Address", "ที่อยู่ IP")} value="203.0.113.42" />
              <StatusItem label={tt(lang, "status.version", "Client Version", "เวอร์ชันไคลเอนต์")} value="v0.4.2" />
              <div className="mt-3 flex gap-2">
                <Button className="rounded-xl">{tt(lang, "actions.details", "Details", "ดูรายละเอียด")}</Button>
                <Button variant="secondary" className="rounded-xl">{tt(lang, "actions.retry", "Retry", "ลองใหม่")}</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="rounded-2xl border-slate-800">
          <CardContent className="p-5">
            <h3 className="text-lg font-semibold mb-3">{tt(lang, "dashboard.table.recentTx", "Recent Transactions", "รายการล่าสุด")}</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400">
                    <th className="py-2 pr-4">{tt(lang, "dashboard.table.time", "Time", "เวลา")}</th>
                    <th className="py-2 pr-4">{tt(lang, "dashboard.table.type", "Type", "ประเภท")}</th>
                    <th className="py-2 pr-4">{tt(lang, "dashboard.table.amount", "Amount", "จำนวน")}</th>
                    <th className="py-2 pr-4">{tt(lang, "dashboard.table.note", "Note", "หมายเหตุ")}</th>
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
          © 2025 Solink • {tt(lang, "dashboard.footer.demo", "Demo view", "แสดงผลแบบสาธิต")}
        </footer>
      </div>
    </div>
  );
}

function SimpleStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 p-3">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

/* default export with Suspense */
export default function Dashboard() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-400">Loading…</div>}>
      <DashboardInner />
    </Suspense>
  );
}
