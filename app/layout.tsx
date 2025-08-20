import { Suspense } from 'react';
export const dynamic = "force-dynamic";
import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import LanguageMenu from "@/components/LanguageMenu";

export const metadata: Metadata = {
  title: "Solink",
  description: "Share bandwidth. Earn rewards.",
};

export default function RootLayout({ children }: { children: React.ReactNode; }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        {/* Skip link เพื่อการเข้าถึง */}
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-slate-800 focus:px-3 focus:py-2"
        >
          Skip to content
        </a>

        <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/70 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60 overflow-visible">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 overflow-visible">
            {/* กลุ่มซ้าย: โลโก้ + เมนูหลัก */}
            <div className="flex items-center gap-8 overflow-visible">
              <Link href="/" className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-500" />
                <span className="text-lg font-semibold">Solink</span>
              </Link>

              {/* เมนูหลัก (โชว์ตั้งแต่ md ขึ้นไป) */}
              <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
                <Link href="/product"   className="hover:text-white transition-colors">Product</Link>
                <Link href="/solutions" className="hover:text-white transition-colors">Solutions</Link>
                <Link href="/pricing"   className="hover:text-white transition-colors">Pricing</Link>
                <Link href="/customers" className="hover:text-white transition-colors">Customers</Link>
                <Link href="/resources" className="hover:text-white transition-colors">Resources</Link>
                <Link href="/company"   className="hover:text-white transition-colors">Company</Link>
                <Link href="/ir"        className="hover:text-white transition-colors">IR</Link>
                <Link href="/contact"   className="hover:text-white transition-colors">Contact / Demo</Link>
              </nav>
            </div>

            {/* กลุ่มขวา: ตัวสลับภาษา (client component) */}
            <Suspense fallback={null}>
              <LanguageMenu />
            </Suspense>
          </div>
        </header>

        <main id="content">
          <Suspense fallback={<div className="p-6 text-slate-400">Loading…</div>}>
            {children}
          </Suspense>
        </main>
      </body>
    </html>
  );
}
