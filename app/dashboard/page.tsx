"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import { RefreshCcw, Copy, BarChart3 } from "lucide-react";

/* ============================================================
   DASHBOARD CONFIGURATION
   ============================================================ */
const API_BASE = "https://api-solink.network/api"; // production API base URL
const COLORS = ["#6366f1", "#22c55e", "#3b82f6", "#f97316", "#a855f7"];

/* ============================================================
   TYPES
   ============================================================ */
interface SummaryData {
  totalUsers: number;
  totalPoints: number;
  totalFarms: number;
  totalRewards: number;
}

interface HourlyData {
  hour: string;
  earned: number;
}

interface TxData {
  date: string;
  count: number;
}

/* ============================================================
   MAIN DASHBOARD COMPONENT
   ============================================================ */
export default function DashboardPage() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [hourly, setHourly] = useState<HourlyData[]>([]);
  const [transactions, setTransactions] = useState<TxData[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  /* ---------------- FETCH HELPERS ---------------- */
  const fetchSummary = async (signal?: AbortSignal) => {
    const res = await fetch(`${API_BASE}/dashboard/summary`, { signal });
    if (!res.ok) throw new Error("Failed to fetch summary");
    return res.json();
  };

  const fetchHourly = async (signal?: AbortSignal) => {
    const res = await fetch(`${API_BASE}/dashboard/hourly`, { signal });
    if (!res.ok) throw new Error("Failed to fetch hourly data");
    return res.json();
  };

  const fetchTransactions = async (signal?: AbortSignal) => {
    const res = await fetch(`${API_BASE}/dashboard/transactions`, { signal });
    if (!res.ok) throw new Error("Failed to fetch transactions");
    return res.json();
  };

  /* ---------------- MAIN REFRESH FUNCTION ---------------- */
  const refresh = useCallback(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        const [s, h, t] = await Promise.all([
          fetchSummary(ac.signal),
          fetchHourly(ac.signal),
          fetchTransactions(ac.signal),
        ]);
        setSummary(s ?? null);
        setHourly(Array.isArray(h) ? h : []);
        setTransactions(Array.isArray(t) ? t : []);
        setErr(null);
      } catch (e: any) {
        setErr(e?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  /* ---------------- AUTO LOAD ON PAGE MOUNT ---------------- */
  useEffect(() => {
    const cleanup = refresh();
    return cleanup;
  }, [refresh]);

  /* ============================================================
     RENDER SECTION
     ============================================================ */
  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-indigo-400" /> Solink Dashboard
        </h1>
        <button
          onClick={refresh}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
        >
          <RefreshCcw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {loading && <p className="text-gray-400">Loading data...</p>}
      {err && <p className="text-red-500">Error: {err}</p>}

      {/* SUMMARY SECTION */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Users", value: summary.totalUsers },
            { label: "Total Farms", value: summary.totalFarms },
            { label: "Total Points", value: summary.totalPoints },
            { label: "Total Rewards", value: summary.totalRewards },
          ].map((item) => (
            <motion.div
              key={item.label}
              className="p-4 rounded-2xl bg-slate-800 shadow-md"
              whileHover={{ scale: 1.05 }}
            >
              <h2 className="text-gray-400">{item.label}</h2>
              <p className="text-2xl font-semibold text-indigo-400">
                {item.value.toLocaleString()}
              </p>
            </motion.div>
          ))}
        </div>
      )}

      {/* HOURLY CHART */}
      <div className="bg-slate-800 rounded-2xl p-4 shadow-md">
        <h2 className="text-white font-semibold mb-4">Hourly Earnings</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={hourly}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip />
            <Line type="monotone" dataKey="earned" stroke="#6366f1" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* TRANSACTIONS CHART */}
      <div className="bg-slate-800 rounded-2xl p-4 shadow-md">
        <h2 className="text-white font-semibold mb-4">Transactions</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={transactions}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
