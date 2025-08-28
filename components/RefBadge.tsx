// components/RefBadge.tsx
"use client";

import { useEffect, useState } from "react";

function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(
    new RegExp("(?:^|;\\s*)" + name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") + "=([^;]*)")
  );
  return m ? decodeURIComponent(m[1]) : null;
}

export default function RefBadge() {
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    setCode(getCookie("solink_ref"));
  }, []);

  if (!code) return null;

  const clear = () => {
    // ลบคุกกี้ฝั่ง client
    document.cookie = `solink_ref=; Max-Age=0; path=/; sameSite=lax`;
    setCode(null);
  };

  return (
    <div className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs text-slate-300">
      <span className="opacity-70">Invited by</span>
      <span className="font-semibold text-sky-300">{code}</span>
      <button
        onClick={clear}
        title="Dismiss"
        className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded hover:bg-slate-800/80"
        aria-label="Dismiss referral badge"
      >
        ×
      </button>
    </div>
  );
}
