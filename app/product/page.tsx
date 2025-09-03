// app/product/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import {
  Shield,
  Zap,
  Globe2,
  BarChart3,
  Rocket,
  Boxes,
  Server,
  Lock,
  BookOpen,
  Github,
  Workflow,
  Cpu,
  Code, // ใช้ไอคอนจริงแทน placeholder
} from "lucide-react";

export const metadata: Metadata = {
  title: "Product — Solink",
  description: "Solink product overview: how it works, core features, security, and FAQs.",
  robots: { index: true, follow: true },
};

const UPDATED = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
}).format(new Date());

const HIGHLIGHTS = [
  { icon: <Zap className="h-5 w-5" />, title: "Instant setup", desc: "Lightweight client, zero-code onboarding." },
  { icon: <Globe2 className="h-5 w-5" />, title: "Global network", desc: "Elastic routing across regions." },
  { icon: <BarChart3 className="h-5 w-5" />, title: "Real-time analytics", desc: "Transparent usage & rewards." },
  { icon: <Shield className="h-5 w-5" />, title: "Security-first", desc: "Encrypted channels & policy control." },
];

const MODULES = [
  { icon: <Boxes className="h-5 w-5" />, name: "Routing", desc: "Policy-based routing with region pinning & failover." },
  { icon: <Server className="h-5 w-5" />, name: "Earnings", desc: "Fair rewards engine with anti-fraud signals." },
  { icon: <Lock className="h-5 w-5" />, name: "Observability", desc: "Metrics, logs, alerts—SOC-ready." },
];

const USE_CASES = [
  { icon: <Workflow className="h-5 w-5" />, name: "Crowd bandwidth", desc: "Aggregate idle capacity from edge nodes." },
  { icon: <Cpu className="h-5 w-5" />, name: "Data egress control", desc: "Route traffic with region & QoS constraints." },
  { icon: <Globe2 className="h-5 w-5" />, name: "Multi-region apps", desc: "Reduce latency with local exit points." },
];

const FAQ = [
  {
    q: "How do rewards work?",
    a: "You earn points based on uptime, bandwidth, and quality. Points convert to SLK on a transparent schedule.",
  },
  {
    q: "What data do you collect?",
    a: "Operational metrics only (latency, throughput, health). We don’t inspect user payloads.",
  },
  {
    q: "Can I run this on a VPS or at home?",
    a: "Yes. The client is lightweight and runs on common Linux, macOS, and Windows hosts.",
  },
];

export default function ProductPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      {/* Hero */}
      <Reveal>
        <header className="text-center">
          <h1 className="text-4xl font-semibold tracking-tight">Product</h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">
            Solink makes bandwidth sharing simple, secure, and rewarding—built for both developers and enterprises.
          </p>
          <div className="mt-3 text-xs text-slate-400">Last updated: {UPDATED}</div>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              href={"/contact" as any}
              className="rounded-2xl bg-sky-600/90 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
            >
              Request a demo
            </Link>
            <Link
              href={"/resources" as any}
              className="rounded-2xl border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-900/60"
            >
              Read docs
            </Link>
          </div>
        </header>
      </Reveal>

      {/* Highlights */}
      <section className="mt-14">
        <Reveal>
          <div>
            <h2 className="text-xl font-semibold">Core capabilities</h2>
            <p className="mt-1 text-slate-400">What you can do with Solink—at a glance.</p>
          </div>
        </Reveal>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map((h, i) => (
            <Reveal key={h.title} delay={0.05 * i}>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                <div className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-2 py-1 text-xs">
                  {h.icon}
                  <span>{h.title}</span>
                </div>
                <p className="mt-3 text-slate-300">{h.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mt-16">
        <Reveal>
          <div>
            <h2 className="text-xl font-semibold">How it works</h2>
            <p className="mt-1 text-slate-400">Three simple steps to get value on day one.</p>
          </div>
        </Reveal>
        <ol className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            { step: "1", title: "Install client", desc: "Run the lightweight agent on your host (1–2 commands)." },
            { step: "2", title: "Start sharing", desc: "The client advertises capacity and enforces your policies." },
            { step: "3", title: "Earn & track", desc: "View uptime, bandwidth, and rewards in the dashboard." },
          ].map((s, i) => (
            <Reveal key={s.step} delay={0.06 * i}>
              <li className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                <div className="text-sky-300 text-sm">Step {s.step}</div>
                <div className="mt-1 text-white font-medium">{s.title}</div>
                <p className="mt-2 text-slate-300">{s.desc}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* Modules */}
      <section className="mt-16">
        <Reveal>
          <div>
            <h2 className="text-xl font-semibold">Modules</h2>
            <p className="mt-1 text-slate-400">Compose what you need—keep the rest out.</p>
          </div>
        </Reveal>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {MODULES.map((m, i) => (
            <Reveal key={m.name} delay={0.05 * i}>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                <div className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-2 py-1 text-xs">
                  {m.icon}
                  <span>{m.name}</span>
                </div>
                <p className="mt-3 text-slate-300">{m.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Use cases */}
      <section className="mt-16">
        <Reveal>
          <div>
            <h2 className="text-xl font-semibold">Use cases</h2>
            <p className="mt-1 text-slate-400">Popular patterns our customers run in production.</p>
          </div>
        </Reveal>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {USE_CASES.map((u, i) => (
            <Reveal key={u.name} delay={0.05 * i}>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                <div className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-2 py-1 text-xs">
                  {u.icon}
                  <span>{u.name}</span>
                </div>
                <p className="mt-3 text-slate-300">{u.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Architecture (compact) */}
      <section className="mt-16">
        <Reveal>
          <div>
            <h2 className="text-xl font-semibold">Architecture at a glance</h2>
            <p className="mt-1 text-slate-400">A simple control plane with a secure, policy-driven data plane.</p>
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <div className="font-medium text-white">Client</div>
                <p className="mt-1 text-slate-300">
                  Lightweight agent exposes capacity and enforces policies locally.
                </p>
              </div>
              <div>
                <div className="font-medium text-white">Control Plane</div>
                <p className="mt-1 text-slate-300">Auth, routing policy, reputation & rewards, observability.</p>
              </div>
              <div>
                <div className="font-medium text-white">Data Plane</div>
                <p className="mt-1 text-slate-300">Encrypted tunnels, regional exit points, QoS & rate control.</p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Security */}
      <section className="mt-16">
        <Reveal>
          <div>
            <h2 className="text-xl font-semibold">Security & compliance</h2>
          </div>
        </Reveal>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {[
            "TLS for all control/data channels",
            "Request signing & integrity checks",
            "Node identity & revocation",
            "Fine-grained routing policies (region/QoS/egress limits)",
          ].map((s, i) => (
            <Reveal key={s} delay={0.05 * i}>
              <li className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3">
                <div className="flex items-start gap-3">
                  <Shield className="mt-0.5 h-4 w-4 text-sky-300" />
                  <span className="text-slate-300">{s}</span>
                </div>
              </li>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* Developers */}
      <section className="mt-16">
        <Reveal>
          <div>
            <h2 className="text-xl font-semibold">Developers</h2>
            <p className="mt-1 text-slate-400">Everything you need to integrate or automate Solink.</p>
          </div>
        </Reveal>
          <div className="mt-5 flex flex-wrap items-center gap-3">
          {[
            { href: "/resources", label: "Docs", icon: <BookOpen className="h-4 w-4" /> },
            { href: "/resources", label: "API examples", icon: <Code className="h-4 w-4" /> },
            { href: "/resources", label: "SDK guides", icon: <Rocket className="h-4 w-4" /> },
            { href: "/resources", label: "Changelog", icon: <BarChart3 className="h-4 w-4" /> },
            { href: "/resources", label: "GitHub (soon)", icon: <Github className="h-4 w-4" /> },
          ].map((l, i) => (
            <Reveal key={l.label} delay={0.05 * i}>
              <Link
                href={l.href as any}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm hover:bg-slate-900/60"
                aria-label={l.label}
              >
                {l.icon}
                <span>{l.label}</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-16">
        <Reveal>
          <h2 className="text-xl font-semibold">FAQ</h2>
        </Reveal>
        <dl className="mt-4 space-y-3">
          {FAQ.map((f, i) => (
            <Reveal key={f.q} delay={0.05 * i}>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                <dt className="font-medium text-white">{f.q}</dt>
                <dd className="mt-1 text-slate-300">{f.a}</dd>
              </div>
            </Reveal>
          ))}
        </dl>
      </section>

      {/* CTA */}
      <section className="mt-16">
        <Reveal>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-center">
            <h3 className="text-xl font-semibold text-white">Ready to try Solink?</h3>
            <p className="mt-2 text-slate-300">Request a guided or start a pilot tailored to your needs.</p>
            <div className="mt-4">
              <Link
                href={"/contact" as any}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
              >
                <Rocket className="h-4 w-4" />
                Request
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
