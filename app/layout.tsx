// app/layout.tsx
import { Suspense } from "react";
import Script from "next/script";
export const dynamic = "force-dynamic";
import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import MainNav from "@/components/MainNav";
import MobileMenu from "@/components/MobileMenu";
import HtmlPrefSync from "@/components/HtmlPrefSync";
import RefBadge from "@/components/RefBadge";
import { NAV_ITEMS } from "@/lib/nav";
import logo from "@/public/solink-logo.png";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Aurora from "@/components/Aurora";

/* ✅  provider  Solana  wallet all app */
import WalletProviders from "@/lib/solana/WalletProviders";

/* ====== Metadata (run server) ====== */
const metadataBaseUrl =
  process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : process.env.VERCEL_URL
    ? new URL(`https://${process.env.VERCEL_URL}`)
    : new URL("http://localhost:3000");

export const metadata: Metadata = {
  title: "Solink",
  description: "Share bandwidth. Earn rewards.",
  metadataBase: metadataBaseUrl,
  alternates: { canonical: "/" },
  openGraph: {
    title: "Solink — Share bandwidth. Earn rewards.",
    description: "Share bandwidth. Earn rewards.",
    url: "/",
    siteName: "Solink",
    type: "website",
    images: ["/og?title=Solink&subtitle=Share%20bandwidth.%20Earn%20rewards."],
  },
  twitter: {
    card: "summary_large_image",
    title: "Solink — Share bandwidth. Earn rewards.",
    description: "Share bandwidth. Earn rewards.",
    images: ["/og?title=Solink"],
  },
  icons: {
    icon: [
      { url: "/solink-logo.png", type: "image/png" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    apple: [{ url: "/solink-logo.png" }],
    shortcut: [{ url: "/favicon.ico" }],
  },
};

/* ====== theme + timezone fast hydrate ====== */
const THEME_TZ_INIT = `
(function(){
  try {
    var m = document.cookie.match(/(?:^|;\\s*)solink_prefs=([^;]+)/);
    var prefs = m ? JSON.parse(decodeURIComponent(m[1])) : {};
    var theme = prefs.theme || "dark";
    if (theme === "light") theme = "dark";
    if (theme === "auto") theme = "system";
    var root = document.documentElement;
    function set(dark, oled){
      root.classList.toggle("dark", !!dark);
      if (oled) root.classList.add("theme-oled"); else root.classList.remove("theme-oled");
    }
    if (theme === "dark") set(true, false);
    else {
      var prefersDark = false;
      try { prefersDark = matchMedia("(prefers-color-scheme: dark)").matches; } catch(e){}
      set(prefersDark, false);
    }
    var tz = (prefs.tz || "UTC");
    root.setAttribute("data-tz", tz);
  } catch(e){}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <Script
          id="theme-tz-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_TZ_INIT }}
        />
      </head>

      <body className="min-h-screen bg-slate-950 text-slate-100 relative">
        <WalletProviders>
          <Aurora />

          <Suspense fallback={null}>
            <HtmlPrefSync />
          </Suspense>

          <a
            href="#content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-slate-800 focus:px-3 focus:py-2"
          >
            Skip to content
          </a>

          <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/70 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60 overflow-visible">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 overflow-visible">
              <div className="flex items-center gap-8 overflow-visible">
                <Link href="/" className="flex items-center gap-3">
                  <Image
                    src={logo}
                    alt="Solink"
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-lg object-contain"
                    priority
                  />
                  <span className="text-lg font-semibold">Solink</span>
                </Link>
                <MainNav items={[...NAV_ITEMS]} />
              </div>

              {/* ❌ Connect Navbar*/}
              <div className="flex items-center gap-3">
                <RefBadge />
                <MobileMenu items={[...NAV_ITEMS]} />
              </div>
            </div>
          </header>

          <main id="content" className="relative z-10">
            <Suspense fallback={<div className="p-6 text-slate-400">Loading…</div>}>
              {children}
            </Suspense>
          </main>

          <Analytics />
          <SpeedInsights />
        </WalletProviders>
      </body>
    </html>
  );
}
