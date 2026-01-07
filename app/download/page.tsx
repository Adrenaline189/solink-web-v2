// app/download/page.tsx
import type { Metadata } from "next";
import React from "react";
import Reveal from "@/components/Reveal";
import { Card, CardContent } from "@/components/ui/card";
import {
  Download,
  Chrome,
  Globe,        // ✅ เพิ่ม
  Puzzle,
  Laptop,
  Monitor,
  Apple,
  Smartphone,
  Code2,
  Webhook,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  Clock3,
  Activity,
  BookOpen,
} from "lucide-react";


export const metadata: Metadata = {
  title: "Download — Solink",
  description:
    "Download Solink apps and extensions, and access developer tools like API docs, webhooks, and service status.",
  robots: { index: true, follow: true },
};

type BadgeType = "available" | "soon";
type ActionKind = "install" | "download" | "open" | "docs";

type Item = {
  title: string;
  description: string;
  icon: React.ReactNode;
  href?: string; // when present = available
  badge?: BadgeType; // optional, derived from href if omitted
  meta?: string; // small helper text (version, platform, etc.)
  kind?: ActionKind; // controls button label/icon
};

function Badge({ type }: { type: BadgeType }) {
  if (type === "available") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Available
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/70">
      <Clock3 className="h-3.5 w-3.5" />
      Coming soon
    </span>
  );
}

function ActionButton({
  href,
  available,
  kind = "download",
}: {
  href?: string;
  available: boolean;
  kind?: ActionKind;
}) {
  const label =
    kind === "install"
      ? "Install"
      : kind === "docs"
      ? "Open docs"
      : kind === "open"
      ? "Open"
      : "Download";

  const Icon =
    kind === "docs" ? BookOpen : kind === "open" ? ExternalLink : Download;

  if (!available) {
    return (
      <button
        disabled
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/40"
      >
        <Clock3 className="h-4 w-4" />
        Coming soon
      </button>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-white/90 transition"
    >
      {label} <Icon className="h-4 w-4" />
    </a>
  );
}

function ItemCard({ item }: { item: Item }) {
  const isAvailable = !!item.href;
  const badgeType: BadgeType = item.badge ?? (isAvailable ? "available" : "soon");

  return (
    <Card className="border-slate-800 bg-slate-900/40">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-white/90">
              {item.icon}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-white">{item.title}</h3>
                <Badge type={badgeType} />
              </div>

              <p className="mt-1 text-sm text-slate-300 leading-relaxed">
                {item.description}
              </p>

              {item.meta ? (
                <div className="mt-2 text-xs text-slate-400">{item.meta}</div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <ActionButton
            href={item.href}
            available={badgeType === "available" && !!item.href}
            kind={item.kind}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function SectionTitle({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-white/90">
          {icon}
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <p className="mt-1 text-sm text-slate-300">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * ✅ ใส่ลิงก์จริงเพื่อให้ขึ้น Available + ปุ่มใช้งานได้
 * - ถ้ายังไม่พร้อม: ปล่อยเป็น "" ได้ (จะแสดง Coming soon)
 */
const LINKS = {
  // Extension
  chromeWebStore: "", // e.g. https://chromewebstore.google.com/detail/...
  firefoxAddons: "", // e.g. https://addons.mozilla.org/en-US/firefox/addon/...

  // Desktop Node
  windows: "",
  macos: "",
  linux: "",

  // Mobile
  ios: "",
  android: "",

  // Dev tools (prefer open pages)
  apiDocs: "/resources/api", // ใช้ resources ที่มีอยู่แล้ว (เปิดได้ทันที)
  webhooks: "", // ถ้ายังไม่มีจริง ให้ปล่อย "" => Coming soon
  status: "", // ถ้ายังไม่มีจริง ให้ปล่อย "" => Coming soon
};

export default function DownloadPage() {
  return (
    <main className="relative mx-auto max-w-6xl px-6 py-14" translate="no">
      {/* subtle bg */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-fuchsia-600/10 blur-3xl" />
        <div className="absolute bottom-0 right-10 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.10] [background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:56px_56px]" />
      </div>

      <Reveal>
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/40 px-3 py-1 text-xs text-slate-200">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            Official downloads • Verified links
          </div>

          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
            Downloads
          </h1>

          <p className="mt-3 max-w-2xl text-slate-300">
            One place for Solink installers, browser extensions, and developer entry points.
            No confusion, no unofficial mirrors.
          </p>
        </header>
      </Reveal>

      <div className="grid gap-10">
        {/* 1) Extension */}
        <Reveal>
          <section>
            <SectionTitle
              title="Solink Extension"
              subtitle="Fast onboarding. Earn points via bandwidth sharing with a lightweight browser extension."
              icon={<Puzzle className="h-5 w-5 text-cyan-200" />}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <ItemCard
                item={{
                  title: "Chrome Web Store",
                  description:
                    "Official extension for Chrome, Brave, Edge (Chromium), and other Chrome-based browsers.",
                  icon: <Chrome className="h-5 w-5" />,
                  href: LINKS.chromeWebStore || undefined,
                  badge: LINKS.chromeWebStore ? "available" : "soon",
                  meta: LINKS.chromeWebStore ? "Ready to install" : "Coming soon",
                  kind: "install",
                }}
              />

              <ItemCard
                item={{
                  title: "Firefox Add-ons",
                  description:
                    "Official Firefox build with the same points and device tracking features.",
                 icon: <Globe className="h-5 w-5" />,

                  href: LINKS.firefoxAddons || undefined,
                  badge: LINKS.firefoxAddons ? "available" : "soon",
                  meta: LINKS.firefoxAddons ? "Ready to install" : "Coming soon",
                  kind: "install",
                }}
              />
            </div>

            <div className="mt-3 text-xs text-slate-500">
              Tip: After installing, connect your wallet on Dashboard to start tracking points.
            </div>
          </section>
        </Reveal>

        {/* 2) Desktop Node */}
        <Reveal delay={0.05}>
          <section>
            <SectionTitle
              title="Solink Node (Desktop)"
              subtitle="For higher stability and long-run rewards. Recommended for power users and always-on devices."
              icon={<Laptop className="h-5 w-5 text-fuchsia-200" />}
            />
            <div className="grid gap-4 md:grid-cols-3">
              <ItemCard
                item={{
                  title: "Windows",
                  description: "Installer for Windows 10/11.",
                  icon: <Monitor className="h-5 w-5" />,
                  href: LINKS.windows || undefined,
                  badge: LINKS.windows ? "available" : "soon",
                  meta: LINKS.windows ? "Ready to download" : "Coming soon",
                  kind: "download",
                }}
              />
              <ItemCard
                item={{
                  title: "macOS",
                  description: "Apple Silicon / Intel builds.",
                  icon: <Apple className="h-5 w-5" />,
                  href: LINKS.macos || undefined,
                  badge: LINKS.macos ? "available" : "soon",
                  meta: LINKS.macos ? "Ready to download" : "Coming soon",
                  kind: "download",
                }}
              />
              <ItemCard
                item={{
                  title: "Linux",
                  description: "Best for servers & power users.",
                  icon: <Laptop className="h-5 w-5" />,
                  href: LINKS.linux || undefined,
                  badge: LINKS.linux ? "available" : "soon",
                  meta: LINKS.linux ? "Ready to download" : "Coming soon",
                  kind: "download",
                }}
              />
            </div>

            <div className="mt-3 text-xs text-slate-500">
              When available, we’ll publish checksums and release notes for every build.
            </div>
          </section>
        </Reveal>

        {/* 3) Mobile */}
        <Reveal delay={0.08}>
          <section>
            <SectionTitle
              title="Mobile"
              subtitle="Track points, manage devices, and receive alerts on the go."
              icon={<Smartphone className="h-5 w-5 text-emerald-200" />}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <ItemCard
                item={{
                  title: "iOS",
                  description: "TestFlight / App Store release.",
                  icon: <Apple className="h-5 w-5" />,
                  href: LINKS.ios || undefined,
                  badge: LINKS.ios ? "available" : "soon",
                  meta: LINKS.ios ? "Ready to download" : "Coming soon",
                  kind: "download",
                }}
              />
              <ItemCard
                item={{
                  title: "Android",
                  description: "Google Play / APK release.",
                  icon: <Smartphone className="h-5 w-5" />,
                  href: LINKS.android || undefined,
                  badge: LINKS.android ? "available" : "soon",
                  meta: LINKS.android ? "Ready to download" : "Coming soon",
                  kind: "download",
                }}
              />
            </div>
          </section>
        </Reveal>

        {/* 4) Developers */}
        <Reveal delay={0.1}>
          <section>
            <SectionTitle
              title="Developers"
              subtitle="Build integrations using Solink APIs, events, and service signals."
              icon={<Code2 className="h-5 w-5 text-white/90" />}
            />
            <div className="grid gap-4 md:grid-cols-3">
              <ItemCard
                item={{
                  title: "API Docs",
                  description: "Endpoints, auth, schemas, and examples.",
                  icon: <Code2 className="h-5 w-5" />,
                  href: LINKS.apiDocs || undefined,
                  badge: LINKS.apiDocs ? "available" : "soon",
                  meta: LINKS.apiDocs ? "Open documentation" : "Coming soon",
                  kind: "docs",
                }}
              />
              <ItemCard
                item={{
                  title: "Webhooks",
                  description: "Receive real-time events in your backend (HMAC + retries).",
                  icon: <Webhook className="h-5 w-5" />,
                  href: LINKS.webhooks || undefined,
                  badge: LINKS.webhooks ? "available" : "soon",
                  meta: LINKS.webhooks ? "Open webhook docs" : "Coming soon",
                  kind: "docs",
                }}
              />
              <ItemCard
                item={{
                  title: "Status",
                  description: "Uptime and incident history for Solink services.",
                  icon: <Activity className="h-5 w-5" />,
                  href: LINKS.status || undefined,
                  badge: LINKS.status ? "available" : "soon",
                  meta: LINKS.status ? "View status page" : "Coming soon",
                  kind: "open",
                }}
              />
            </div>
          </section>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="text-xs text-slate-500">
            Security note: only use links from this page. If someone shares a different link, verify it here first.
          </div>
        </Reveal>
      </div>
    </main>
  );
}
