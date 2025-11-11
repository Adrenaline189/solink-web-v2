// lib/prefs-client.ts
"use client";

import { useEffect, useState } from "react";
import type { Preferences } from "./prefs";
import { DEFAULT_PREFS } from "./prefs";

/** อ่าน timezone ฝั่ง client จาก ENV ที่ฝังไว้ตอน build (fallback เป็น UTC) */
function getFixedTZ(): string {
  // NEXT_PUBLIC_* จะถูกอินไลน์เป็นสตริงตอน build บน Next.js
  return process.env.NEXT_PUBLIC_SOLINK_TIMEZONE || "UTC";
}

/**
 * ใช้สำหรับอ่าน/บันทึก preferences ฝั่ง client
 * - ไม่เก็บ timezone ใน prefs อีกต่อไป (ใช้ UTC คงที่จาก ENV)
 * - คงรูปแบบเดิม + เพิ่ม field tz ให้เรียกใช้ง่าย
 */
export function usePrefs() {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const tz = getFixedTZ();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/prefs", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (alive && res.ok && data?.prefs) {
          // ผสานกับ DEFAULT_PREFS เพื่อกัน field ขาด
          setPrefs({ ...DEFAULT_PREFS, ...(data.prefs as Preferences) });
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { prefs, loading, setPrefs, tz };
}
