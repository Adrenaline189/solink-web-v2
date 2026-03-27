import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import { Code, Globe, Zap, BookOpen, Terminal, Database, Shield } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Developers — Solink",
  description: "Developer resources for building on Solink: API reference, SDKs, status, and changelog.",
  robots: { index: true, follow: true },
};

const API_ENDPOINTS = [
  { method: "GET", path: "/api/dashboard/summary", desc: "User points, SLK, uptime, bandwidth summary" },
  { method: "GET", path: "/api/dashboard/realtime", desc: "Live points earned today (rolled + live)" },
  { method: "GET", path: "/api/dashboard/hourly", desc: "Hourly points breakdown for range" },
  { method: "GET", path: "/api/dashboard/daily", desc: "Daily points breakdown for range" },
  { method: "GET", path: "/api/dashboard/transactions", desc: "Point event history (paginated)" },
  { method: "GET", path: "/api/dashboard/metrics", desc: "System-wide metrics (hourly)" },
  { method: "GET", path: "/api/dashboard/system-daily", desc: "System-wide daily metrics" },
  { method: "GET", path: "/api/dashboard/ping", desc: "Node latency (ping)" },
  { method: "GET", path: "/api/dashboard/farm-stats", desc: "Extension farm stats for authenticated user" },
  { method: "GET", path: "/api/dashboard/referral-stats", desc: "Referral stats and bonus breakdown" },
  { method: "GET", path: "/api/sharing/status", desc: "Sharing state (on/off) for wallet" },
  { method: "POST", path: "/api/sharing/toggle", desc: "Start or stop bandwidth sharing" },
  { method: "POST", path: "/api/sharing/heartbeat", desc: "Send sharing heartbeat (earnings)" },
  { method: "POST", path: "/api/dashboard/convert", desc: "Convert points to SLK" },
  { method: "GET", path: "/api/health", desc: "API health check" },
  { method: "GET", path: "/api/db/health", desc: "Database connectivity check" },
];

const LANGUAGES = [
  { name: "TypeScript / JavaScript", desc: "Official SDK via npm", icon: "ts", color: "bg-blue-900/50 border-blue-700/50 text-blue-300" },
  { name: "Python", desc: "Community SDK via PyPI", icon: "py", color: "bg-yellow-900/50 border-yellow-700/50 text-yellow-300" },
  { name: "Rust", desc: "Native Solana program bindings", icon: "rs", color: "bg-orange-900/50 border-orange-700/50 text-orange-300" },
  { name: "Go", desc: "gRPC + REST client", icon: "go", color: "bg-cyan-900/50 border-cyan-700/50 text-cyan-300" },
];

const RESOURCES = [
  {
    title: "API Reference",
    desc: "Complete REST API documentation with request/response examples, authentication, and rate limits.",
    href: "#api",
    icon: Code,
    color: "cyan",
  },
  {
    title: "SDK & Libraries",
    desc: "Official SDKs for TypeScript, Python, Rust, and Go. Community-maintained clients.",
    href: "#sdks",
    icon: Terminal,
    color: "fuchsia",
  },
  {
    title: "Solana Program (Anchor)",
    desc: "On-chain program for presale, reward distribution, and governance on Solana.",
    href: "#programs",
    icon: Globe,
    color: "violet",
  },
  {
    title: "Whitepaper",
    desc: "Full technical specification: protocol architecture, rewards model, tokenomics, and governance.",
    href: "/whitepaper",
    icon: BookOpen,
    color: "emerald",
  },
  {
    title: "System Status",
    desc: "Real-time uptime monitoring, incident history, and API health checks.",
    href: "/status",
    icon: Shield,
    color: "amber",
  },
  {
    title: "Changelog",
    desc: "Latest updates, fixes, and improvements to the Solink protocol and dashboard.",
    href: "/changelog",
    icon: Zap,
    color: "rose",
  },
];

const COLOR_MAP: Record<string, string> = {
  cyan: "from-cyan-950/60 to-cyan-950/20 border-cyan-800/60",
  fuchsia: "from-fuchsia-950/60 to-fuchsia-950/20 border-fuchsia-800/60",
  violet: "from-violet-950/60 to-violet-950/20 border-violet-800/60",
  emerald: "from-emerald-950/60 to-emerald-950/20 border-emerald-800/60",
  amber: "from-amber-950/60 to-amber-950/20 border-amber-800/60",
  rose: "from-rose-950/60 to-rose-950/20 border-rose-800/60",
};

export default function DevelopersPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      {/* Header */}
      <Reveal>
        <header className="mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold">Developers</h1>
          <p className="mt-4 text-lg text-slate-400 max-w-2xl">
            Build with Solink. Access bandwidth APIs, integrate the SDK, or deploy on-chain programs.
          </p>
        </header>
      </Reveal>

      {/* Resources grid */}
      <Reveal>
        <h2 className="text-xl font-bold mb-6">Resources</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
          {RESOURCES.map((r) => {
            const borderClass = COLOR_MAP[r.color] ?? COLOR_MAP.cyan;
            return (
              <a
                key={r.title}
                href={r.href}
                className={`rounded-2xl border bg-gradient-to-br p-5 ${borderClass} hover:opacity-80 transition`}
              >
                <r.icon className="size-6 mb-3" />
                <div className="font-semibold mb-1">{r.title}</div>
                <div className="text-sm text-slate-400">{r.desc}</div>
              </a>
            );
          })}
        </div>
      </Reveal>

      {/* API Reference */}
      <section id="api" className="mb-16 scroll-mt-8">
        <Reveal>
          <div className="flex items-center gap-3 mb-6">
            <Code className="size-6 text-cyan-400" />
            <h2 className="text-xl font-bold">API Reference</h2>
            <span className="ml-auto text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">REST · JSON</span>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <div className="rounded-2xl border border-slate-800 overflow-hidden">
            <div className="bg-slate-950/60 px-4 py-3 border-b border-slate-800">
              <p className="text-sm text-slate-400">
                Base URL: <code className="text-cyan-400">https://api.solink.network</code>
              </p>
            </div>
            <div className="divide-y divide-slate-800/60">
              {API_ENDPOINTS.map((ep) => (
                <div key={ep.path} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-900/30">
                  <span
                    className={`shrink-0 rounded px-2 py-0.5 text-xs font-mono font-bold ${
                      ep.method === "GET"
                        ? "bg-sky-900/50 text-sky-300 border border-sky-700/50"
                        : "bg-amber-900/50 text-amber-300 border border-amber-700/50"
                    }`}
                  >
                    {ep.method}
                  </span>
                  <div className="flex-1 min-w-0">
                    <code className="text-sm text-white font-mono">{ep.path}</code>
                    <p className="text-xs text-slate-500 mt-0.5">{ep.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Auth note */}
        <Reveal delay={0.1}>
          <div className="mt-4 rounded-xl border border-amber-800/50 bg-amber-950/20 p-4">
            <div className="text-sm font-semibold text-amber-300 mb-1">Authentication</div>
            <p className="text-sm text-slate-400">
              Most endpoints require a valid <code className="text-amber-300">solink_auth</code> JWT cookie
              (set after wallet sign-in). Public endpoints: <code className="text-amber-300">/api/health</code>,{" "}
              <code className="text-amber-300">/api/db/health</code>, <code className="text-amber-300">/api/status</code>.
            </p>
          </div>
        </Reveal>
      </section>

      {/* SDKs */}
      <section id="sdks" className="mb-16 scroll-mt-8">
        <Reveal>
          <h2 className="text-xl font-bold mb-6">SDKs & Libraries</h2>
        </Reveal>
        <div className="grid md:grid-cols-2 gap-4">
          {LANGUAGES.map((lang) => (
            <Reveal key={lang.name} delay={0.05}>
              <div className={`rounded-2xl border ${lang.color} p-5`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono font-bold text-sm">{lang.icon.toUpperCase()}</span>
                  <span className="font-semibold">{lang.name}</span>
                </div>
                <p className="text-sm text-slate-400">{lang.desc}</p>
                <code className="mt-3 block text-xs text-slate-500">
                  npm install @solink/sdk  {/* placeholder */}
                </code>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Solana Programs */}
      <section id="programs" className="mb-16 scroll-mt-8">
        <Reveal>
          <div className="flex items-center gap-3 mb-6">
            <Globe className="size-6 text-violet-400" />
            <h2 className="text-xl font-bold">Solana Programs</h2>
          </div>
        </Reveal>
        <Reveal delay={0.05}>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                name: "Presale Program",
                programId: "Pending deployment",
                desc: "Manages presale rounds, token purchase, and vesting schedules on Solana.",
                methods: ["buy()", "claim()", "get_price()", "get_round()"],
              },
              {
                name: "Token Program (SPL)",
                programId: "Token Mint",
                desc: "SPL token for $SLK with total supply 1,000,000,000.",
                methods: ["transfer()", "mint()", "burn()", "get_balance()"],
              },
              {
                name: "Rewards Program",
                programId: "Pending deployment",
                desc: "Distributes SLK rewards to node operators based on bandwidth contribution.",
                methods: ["distribute()", "slash()", "update_qf()"],
              },
              {
                name: "Governance Program",
                programId: "Planned",
                desc: "DAO governance for treasury, parameter updates, and protocol decisions.",
                methods: ["propose()", "vote()", "execute()"],
              },
            ].map((prog) => (
              <div
                key={prog.name}
                className="rounded-2xl border border-violet-800/60 bg-violet-950/20 p-5"
              >
                <div className="font-semibold mb-1">{prog.name}</div>
                <div className="text-xs text-slate-500 font-mono mb-3">{prog.programId}</div>
                <p className="text-sm text-slate-400 mb-3">{prog.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {prog.methods.map((m) => (
                    <span
                      key={m}
                      className="rounded bg-violet-950/60 border border-violet-800/60 px-2 py-0.5 text-xs font-mono text-violet-300"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Quick Start */}
      <Reveal>
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-950/80 to-slate-900/40 p-6">
          <h2 className="text-lg font-bold mb-3">Quick Start</h2>
          <pre className="text-sm text-slate-300 overflow-x-auto">
{`# Install the SDK
npm install @solink/sdk

# Initialize with your wallet
import { SolinkSDK } from '@solink/sdk';

const solink = new SolinkSDK({
  wallet: yourWallet,
  network: 'mainnet-beta',
});

# Query your dashboard
const summary = await solink.dashboard.summary();
console.log(summary.points, summary.slk);

# Start earning
await solink.sharing.start();
await solink.sharing.heartbeat({ bandwidthMbps: 50 });`}
          </pre>
        </div>
      </Reveal>

      <Footer />
    </div>
  );
}
