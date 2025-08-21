// app/[locale]/layout.tsx
import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import LanguageMenu from "@/components/LanguageMenu";
import MobileMenu from "@/components/MobileMenu";
import MainNav from "@/components/MainNav";
import { NAV_ITEMS } from "@/lib/nav";
import logo from "@/public/solink-logo.png";

export const metadata: Metadata = {
  title: "Solink",
  description: "Share bandwidth. Earn rewards.",
};

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const locale = params.locale || "en";
  const localizedItems = NAV_ITEMS.map(i => ({ ...i, href: `/${locale}${i.href}` }));

  return (
    <>
      {/* Skip link */}
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-slate-800 focus:px-3 focus:py-2"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/70 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60 overflow-visible">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 overflow-visible">
          <div className="flex items-center gap-8 overflow-visible">
            <Link href={`/${locale}`} className="flex items-center gap-3">
              <Image src={logo} alt="Solink" width={32} height={32} className="h-8 w-8 rounded-lg object-contain" priority />
              <span className="text-lg font-semibold text-white">Solink</span>
            </Link>
            <MainNav items={localizedItems} />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Suspense fallback={null}>
              <LanguageMenu />
            </Suspense>
            <MobileMenu items={localizedItems} />
          </div>
        </div>
      </header>

      <main id="content">{children}</main>
    </>
  );
}
