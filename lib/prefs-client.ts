// lib/prefs-client.ts
"use client";

import { useEffect, useState } from "react";
import type { Preferences } from "./prefs";
import { DEFAULT_PREFS } from "./prefs";

export function usePrefs() {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/prefs", { cache: "no-store" });
        const data = await res.json();
        if (alive && res.ok && data?.prefs) setPrefs(data.prefs as Preferences);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return { prefs, loading, setPrefs };
}
