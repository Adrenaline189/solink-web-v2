// lib/usePrefs.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import type { Preferences } from "./prefs";
import { sanitizePrefs, DEFAULT_PREFS } from "./prefs";

type UsePrefs = {
  prefs: Preferences;
  loading: boolean;
  saving: boolean;
  set: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  save: () => Promise<void>;
};

export function usePrefs(): UsePrefs {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch("/api/prefs", { cache: "no-store" });
        const json = await res.json();
        if (ignore) return;
        const got = sanitizePrefs(json?.prefs);
        setPrefs(got);
      } catch {
        setPrefs(DEFAULT_PREFS);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const set = useCallback(<K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setPrefs((p) => ({ ...p, [key]: value }));
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      await fetch("/api/prefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
    } finally {
      setSaving(false);
    }
  }, [prefs]);

  return { prefs, loading, saving, set, save };
}
