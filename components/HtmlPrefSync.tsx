// components/HtmlPrefSync.tsx
"use client";

import { useEffect } from "react";
import { usePrefs } from "@/lib/prefs-client";

/**
 * ซิงก์ค่าที่อาจเปลี่ยนหลัง hydrate → DOM
 * ตอนนี้สนใจเฉพาะ data-tz (theme ล็อก dark ไว้)
 */
export default function HtmlPrefSync() {
  const { prefs } = usePrefs();

  useEffect(() => {
    const root = document.documentElement;
    // set TZ attribute ให้พวก formatter / chart อ่านได้
    root.setAttribute("data-tz", prefs.tz || "UTC");
  }, [prefs.tz]);

  return null;
}
