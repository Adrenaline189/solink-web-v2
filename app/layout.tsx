import { Suspense } from 'react';
export const dynamic = "force-dynamic";
import "./globals.css";
import type { Metadata } from "next";
import LanguageMenu from "@/components/LanguageMenu";

export const metadata: Metadata = {
  title: "Solink",
  description: "Share bandwidth. Earn rewards.",
};

export default function RootLayout({ children }: { children: React.ReactNode; }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/70 backdrop-blur overflow-visible">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 overflow-visible">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-500" />
              <span className="text-lg font-semibold">Solink</span>
            </div>
            <Suspense fallback={null}>
              <LanguageMenu />
            </Suspense>
          </div>
        </header>
        <main><Suspense fallback={<div className="p-6 text-slate-400">Loading…</div>}>
            {children}
          </Suspense></main>
      </body>
    </html>
  );
}
