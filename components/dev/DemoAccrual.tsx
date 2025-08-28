// components/dev/DemoAccrual.tsx
"use client";

import { useEffect, useRef, useState } from "react";

export default function DemoAccrual() {
  const [enabled, setEnabled] = useState(false);
  const [running, setRunning] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, []);

  const toggleSim = async (on: boolean, reset = false) => {
    await fetch("/api/dev/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enable: on, reset })
    });
    setEnabled(on);
    setRunning(false);
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
  };

  const accrue = async () => {
    const r = await fetch("/api/dev/accrue", { method: "POST", headers: { "Content-Type": "application/json" } });
    if (!r.ok) return;
    // กระตุก UI ให้รีโหลดการ์ด (หน้า Dashboard ของคุณดึงข้อมูลอยู่แล้วแบบ no-store)
    // ทำแบบง่ายสุด: ยิง event ให้ useEffect ฝั่งหน้า fetch ใหม่ก็ได้
    // ที่นี่เราไม่ต้องทำอะไรเพราะหน้า fetch แบบ no-store อยู่แล้วเมื่อเปลี่ยนโฟกัส/คลิก
  };

  const start = async () => {
    if (!enabled) await toggleSim(true, false);
    setRunning(true);
    tickRef.current = setInterval(() => {
      fetch("/api/dev/accrue", { method: "POST" });
    }, 5000); // ทุก 5 วิ
  };

  const stop = async () => {
    setRunning(false);
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
  };

  return (
    <div className="rounded-xl border border-slate-800 p-3 text-sm bg-slate-900/40">
      <div className="font-semibold mb-2">Demo Points Simulator</div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => toggleSim(true, true)}
          className="px-3 py-1 rounded-lg border border-slate-700 hover:bg-slate-800"
        >
          Enable & Reset
        </button>
        <button
          onClick={() => toggleSim(false, true)}
          className="px-3 py-1 rounded-lg border border-slate-700 hover:bg-slate-800"
        >
          Disable
        </button>
        <button
          onClick={accrue}
          className="px-3 py-1 rounded-lg border border-slate-700 hover:bg-slate-800"
        >
          Accrue now
        </button>
        {!running ? (
          <button
            onClick={start}
            className="px-3 py-1 rounded-lg border border-emerald-700 text-emerald-300 hover:bg-emerald-900/20"
          >
            Start auto
          </button>
        ) : (
          <button
            onClick={stop}
            className="px-3 py-1 rounded-lg border border-rose-700 text-rose-300 hover:bg-rose-900/20"
          >
            Stop auto
          </button>
        )}
      </div>
      <div className="mt-2 text-xs text-slate-400">
        Works in dev only (in-memory). Data resets when server restarts.
      </div>
    </div>
  );
}
