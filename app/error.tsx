// app/error.tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[App Error]", error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-bold">Something went wrong</h1>
          <p className="text-slate-400 mt-2">An unexpected error occurred. Please try again.</p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              onClick={() => reset()}
              className="rounded-xl bg-sky-600/90 hover:bg-sky-600 px-4 py-2 text-sm font-medium"
            >
              Retry
            </button>
            <Link href="/" className="rounded-xl border border-slate-700 hover:bg-slate-900/60 px-4 py-2 text-sm">
              Back to Home
            </Link>
          </div>
          {error?.digest && <div className="mt-3 text-xs text-slate-500">Ref: {error.digest}</div>}
        </div>
      </body>
    </html>
  );
}
