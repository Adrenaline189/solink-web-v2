import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import { Tag, Zap, Shield, Code, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "Changelog — Solink",
  description: "Latest updates, fixes and improvements to Solink. Follow our progress from beta to mainnet.",
  robots: { index: true, follow: true },
};

type Log = {
  date: string;
  version: string;
  tag: "feature" | "fix" | "improvement" | "security" | "api" | "announcement";
  title: string;
  body: string;
};

const LOGS: Log[] = [
  {
    date: "2026-03-27",
    version: "v0.9.0",
    tag: "feature",
    title: "Dashboard v1 — Full release",
    body: "Complete dashboard with KPI cards, hourly/daily charts, system status monitor, sharing toggle, SLK conversion panel, extension farm card, and referral stats. All endpoints wired to Neon PostgreSQL.",
  },
  {
    date: "2026-03-27",
    version: "v0.9.0",
    tag: "feature",
    title: "Presale page redesign",
    body: "Redesigned with Round X of 3 labels, full schedule overview, date range display on every phase, and updated pricing ($8.75M total raise).",
  },
  {
    date: "2026-03-27",
    version: "v0.9.0",
    tag: "feature",
    title: "Tokenomics page — updated vesting schedule",
    body: "Public sale now 10% TGE + 6m vest (from 100% TGE). Team vesting updated to 12m cliff + 18m vest. Marketing updated to 6m cliff + 18m vest. Treasury now max 3%/quarter. Total raise updated to $8.75M.",
  },
  {
    date: "2026-03-27",
    version: "v0.9.0",
    tag: "feature",
    title: "Pricing page redesign",
    body: "Split into two sections: Consumers (bandwidth pricing at $0.04/GB with SLK discount up to 20%) and Node Operators (earn SLK by sharing bandwidth, example earnings displayed).",
  },
  {
    date: "2026-03-27",
    version: "v0.9.0",
    tag: "feature",
    title: "Whitepaper PDF v1.0 released",
    body: "Full 14-section whitepaper PDF generated covering abstract, definitions, problem & opportunity, protocol overview, architecture, rewards model, tokenomics, fees, governance, security, risks, roadmap, references, and disclaimer.",
  },
  {
    date: "2026-03-26",
    version: "v0.8.5",
    tag: "improvement",
    title: "Earning formula aligned with pricing",
    body: "Points per minute now scale with bandwidth: bandwidth_Mbps × 0.7. Dashboard displays estimated SLK/month based on current bandwidth. Example: 10 Mbps ≈ 500 SLK/month, 50 Mbps ≈ 3,000 SLK/month.",
  },
  {
    date: "2026-03-26",
    version: "v0.8.5",
    tag: "fix",
    title: "Rolled points use correct day",
    body: "Rolled now reads from yesterday's metricsDaily instead of today. System daily chart reads today's data from metricsHourly aggregate for consistency.",
  },
  {
    date: "2026-03-26",
    version: "v0.8.5",
    tag: "fix",
    title: "Transaction history uses occurredAt",
    body: "Fixed transaction list to sort and filter by occurredAt instead of createdAt, ensuring accurate history matching the point ledger.",
  },
  {
    date: "2026-03-26",
    version: "v0.8.5",
    tag: "fix",
    title: "Convert endpoint auth fixed",
    body: "Convert endpoint now uses getAuthContext() consistently with all other API routes instead of manual cookie parsing.",
  },
  {
    date: "2026-03-25",
    version: "v0.8.0",
    tag: "feature",
    title: "Extension Farm Card",
    body: "New dashboard card showing extension farm status, today's earnings, total points, and uptime. Includes simulate button for testing without real extension.",
  },
  {
    date: "2026-03-25",
    version: "v0.8.0",
    tag: "feature",
    title: "Referral Stats Card",
    body: "New dashboard card with referral link, referred user count, bonus breakdown (today/week/all-time), and how-it-works guide.",
  },
  {
    date: "2026-03-25",
    version: "v0.8.0",
    tag: "feature",
    title: "Extension Download Banner",
    body: "Dismissible amber banner on dashboard prompting users to install the Chrome extension with feature highlights.",
  },
  {
    date: "2026-03-25",
    version: "v0.8.0",
    tag: "feature",
    title: "Region & version tracking in heartbeat",
    body: "Heartbeat now sends and stores region and version in metricsHourly for accurate System Status display.",
  },
  {
    date: "2026-03-24",
    version: "v0.7.0",
    tag: "feature",
    title: "Real-time dashboard polling",
    body: "Points today and system metrics now refresh every 5 seconds. Hourly and daily charts update live. Node latency monitored in real-time.",
  },
  {
    date: "2026-03-24",
    version: "v0.7.0",
    tag: "security",
    title: "Auth middleware unified",
    body: "All API routes now use getAuthContext() with JWT cookie solink_auth. Legacy solink_wallet cookie fallback removed from critical endpoints.",
  },
  {
    date: "2026-03-20",
    version: "v0.6.0",
    tag: "feature",
    title: "Sharing toggle with heartbeat",
    body: "Start/stop bandwidth sharing from dashboard. Toggle writes SharingState to DB and sends heartbeats every 15 minutes.",
  },
  {
    date: "2026-03-20",
    version: "v0.6.0",
    tag: "feature",
    title: "SLK conversion panel",
    body: "Dashboard panel to preview and convert off-chain points to SLK. Shows rate, balance, and transaction history.",
  },
  {
    date: "2026-03-15",
    version: "v0.5.0",
    tag: "feature",
    title: "Cron jobs: hourly & daily rollup",
    body: "rollup-hourly aggregates PointEvents into MetricsHourly. rollup-daily aggregates into MetricsDaily. System global metrics computed separately.",
  },
  {
    date: "2026-03-10",
    version: "v0.4.0",
    tag: "feature",
    title: "Points ledger with deduplication",
    body: "PointEvent model as immutable ledger. DedupeKey prevents double-counting. EARN_TYPES separates earning from deduction events.",
  },
  {
    date: "2026-03-01",
    version: "v0.3.0",
    tag: "announcement",
    title: "Website launch",
    body: "Solink website goes live with landing page, presale, tokenomics, whitepaper, and status pages. Neovim credit included.",
  },
];

const TAG_CONFIG: Record<Log["tag"], { label: string; className: string; Icon: React.ElementType }> = {
  feature: { label: "Feature", className: "bg-cyan-900/40 border-cyan-700/50 text-cyan-300", Icon: Zap },
  fix: { label: "Fix", className: "bg-rose-900/40 border-rose-700/50 text-rose-300", Icon: Shield },
  improvement: { label: "Improvement", className: "bg-sky-900/40 border-sky-700/50 text-sky-300", Icon: Globe },
  security: { label: "Security", className: "bg-amber-900/40 border-amber-700/50 text-amber-300", Icon: Shield },
  api: { label: "API", className: "bg-violet-900/40 border-violet-700/50 text-violet-300", Icon: Code },
  announcement: { label: "Announcement", className: "bg-emerald-900/40 border-emerald-700/50 text-emerald-300", Icon: Tag },
};

function groupByMonth(logs: Log[]) {
  const groups: Record<string, Log[]> = {};
  for (const log of logs) {
    const key = log.date.slice(0, 7); // "YYYY-MM"
    if (!groups[key]) groups[key] = [];
    groups[key].push(log);
  }
  return groups;
}

export default function ChangelogPage() {
  const grouped = groupByMonth(LOGS);

  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <Reveal>
        <header className="mb-12">
          <h1 className="text-4xl font-extrabold">Changelog</h1>
          <p className="mt-3 text-slate-400">
            Follow Solink&apos;s progress from beta to mainnet launch.
          </p>
        </header>
      </Reveal>

      {Object.entries(grouped).map(([month, items], gi) => (
        <Reveal key={month} delay={0.05 * gi}>
          <div className="mb-10">
            <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
              {month}
            </div>
            <div className="space-y-4">
              {items.map((l, i) => {
                const tc = TAG_CONFIG[l.tag];
                return (
                  <div
                    key={i}
                    className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${tc.className}`}
                        >
                          <tc.Icon className="size-3" />
                          {tc.label}
                        </span>
                        <span className="text-xs text-slate-500">{l.version}</span>
                      </div>
                      <span className="text-xs text-slate-500">{l.date}</span>
                    </div>
                    <h3 className="font-semibold text-white mb-1.5">{l.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{l.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>
      ))}

      <Reveal>
        <div className="mt-12 rounded-2xl border border-slate-800 bg-slate-950/40 p-6 text-center">
          <p className="text-slate-400 text-sm">
            Want the latest updates?{" "}
            <a href="/status" className="text-cyan-400 hover:underline">
              Check system status
            </a>{" "}
            or{" "}
            <a href="/presale" className="text-cyan-400 hover:underline">
              join the presale
            </a>
            .
          </p>
        </div>
      </Reveal>

      <Footer />
    </div>
  );
}
