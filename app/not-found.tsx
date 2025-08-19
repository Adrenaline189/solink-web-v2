"use client";
export const dynamic = 'force-dynamic';
import { Suspense } from 'react';

export default function NotFound() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-400">Loading…</div>}>
      <div className="mx-auto max-w-2xl p-8 text-center">
        <h1 className="text-3xl font-extrabold">404 — Page not found</h1>
        <p className="mt-2 text-slate-400">The page you are looking for does not exist.</p>
      </div>
    </Suspense>
  );
}
