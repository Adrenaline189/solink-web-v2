// app/ir/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import SeoJsonLd from "@/components/SeoJsonLd";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  Newspaper,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  Mail,
  Sparkles,
  Globe2,
  BadgeCheck,
} from "lucide-react";

function getSiteUrl() {
  const envBase = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envBase) return envBase.replace(/\/$/, "");
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) return `https://${vercelUrl.replace(/\/$/, "")}`;
  return "https://www.solink.network";
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.solink.network"),
  title: "Investor Relations — Solink",
  description: "Company overview, token economics, and key disclosures for investors.",
  alternates: { canonical: "/ir" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: "/ir",
    title: "Investor Relations — Solink",
    description: "Company overview, token economics, and key disclosures for investors.",
    siteName: "Solink",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Solink" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Investor Relations — Solink",
    description: "Company overview, token economics, and key disclosures for investors.",
    images: ["/og.png"],
  },
};

function Chip({ children }: React.PropsWithChildren) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 backdrop-blur">
      {children}
    </span>
  );
}

function ActionLink({
  href,
  children,
  variant = "primary",
  ariaLabel,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  ariaLabel?: string;
}) {
  const base =
    "inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition";
  const primary = "bg-white text-slate-900 hover:bg-white/90";
  const secondary =
    "border border-white/15 bg-white/5 text-white hover:bg-white/10";
  return (
    <Link href={href as any} className={`${base} ${variant === "primary" ? primary : secondary}`} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}

export default function IRPage() {
  const siteUrl = getSiteUrl();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Investor Relations — Solink",
    url: `${siteUrl}/ir`,
    description: "Company overview, token economics, and key disclosures for investors.",
    isPartOf: { "@type": "WebSite", name: "Solink", url: siteUrl },
  };

  return (
    <main className="relative min-h-[80vh] px-6 py-16 text-slate-100" translate="no">
      <SeoJsonLd data={jsonLd} />

      {/* Glow BG */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-fuchsia-600/15 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl space-y-10">
        {/* Header */}
        <Reveal>
          <header className="text-center">
            <div className="flex flex-wrap justify-center gap-2">
              <Chip>
                <Sparkles className="h-4 w-4" /> Public testnet
              </Chip>
              <Chip>
                <BadgeCheck className="h-4 w-4" /> Transparent disclosures
              </Chip>
              <Chip>
                <Globe2 className="h-4 w-4" /> Global network
              </Chip>
            </div>

            <h1 className="mt-5 text-4xl md:text-5xl font-semibold tracking-tight text-white">
              Investor Relations
            </h1>

            <p className="mx-auto mt-4 max-w-3xl text-white/75 leading-relaxed">
              Key materials for investors and partners. For additional info, contact{" "}
              <a href="mailto:ir@solink.network" className="text-sky-300 hover:underline">
                ir@solink.network
              </a>.
            </p>

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <ActionLink href="/ir/news" ariaLabel="Latest IR news">
                Latest news <Newspaper className="h-4 w-4" />
              </ActionLink>
              <ActionLink href="/contact" variant="secondary" ariaLabel="Contact IR">
                <Mail className="h-4 w-4" />
                Contact IR
              </ActionLink>
            </div>
          </header>
        </Reveal>

        {/* Highlights */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Reveal delay={0.02}>
            <Card className="rounded-3xl border-white/10 bg-white/5 backdrop-blur transition hover:bg-white/10 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-2">
                    <BarChart3 className="h-5 w-5 text-cyan-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Network growth</h3>
                </div>
                <p className="mt-3 text-sm text-white/75 leading-relaxed">
                  Expanding node presence across regions to improve resiliency and reduce latency.
                </p>
              </CardContent>
            </Card>
          </Reveal>

          <Reveal delay={0.06}>
            <Card className="rounded-3xl border-white/10 bg-white/5 backdrop-blur transition hover:bg-white/10 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Security-first</h3>
                </div>
                <p className="mt-3 text-sm text-white/75 leading-relaxed">
                  Privacy-preserving architecture with rigorous review and safe operating policies.
                </p>
              </CardContent>
            </Card>
          </Reveal>

          <Reveal delay={0.1}>
            <Card className="rounded-3xl border-white/10 bg-white/5 backdrop-blur transition hover:bg-white/10 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-2">
                    <FileText className="h-5 w-5 text-indigo-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Transparent metrics</h3>
                </div>
                <p className="mt-3 text-sm text-white/75 leading-relaxed">
                  Periodic updates with network quality signals, rewards integrity, and treasury notes.
                </p>
              </CardContent>
            </Card>
          </Reveal>
        </section>

        {/* Key Documents */}
        <Reveal>
          <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 md:p-8 backdrop-blur">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">Key documents</h2>
                <p className="mt-1 text-sm text-white/70">
                  Download the latest materials. Replace links with real files in <code>/public/docs</code>.
                </p>
              </div>
              <Link
                href={"/resources" as any}
                className="inline-flex items-center gap-2 text-sm font-semibold text-sky-300 hover:text-sky-200"
              >
                Browse resources <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Reveal delay={0.02}>
                <Card className="rounded-3xl border-white/10 bg-white/5 backdrop-blur">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">Whitepaper</h3>
                        <p className="mt-2 text-sm text-white/75 leading-relaxed">
                          Architecture, incentives, and protocol design.
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/10 p-2">
                        <FileText className="h-5 w-5 text-white/80" />
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <a
                        href="/docs/solink-whitepaper.pdf"
                        className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
                      >
                        <FileText className="h-4 w-4" />
                        Download PDF
                      </a>
                      <Link
                        href={"/whitepaper" as any}
                        className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-sky-300 hover:text-sky-200"
                      >
                        View page <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </Reveal>

              <Reveal delay={0.06}>
                <Card className="rounded-3xl border-white/10 bg-white/5 backdrop-blur">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">Token economics</h3>
                        <p className="mt-2 text-sm text-white/75 leading-relaxed">
                          Distribution, emissions, and utility of SLK.
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/10 p-2">
                        <BarChart3 className="h-5 w-5 text-white/80" />
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <a
                        href="/docs/solink-token-economics.pdf"
                        className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
                      >
                        <FileText className="h-4 w-4" />
                        Download PDF
                      </a>
                      <Link
                        href={"/tokenomics" as any}
                        className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-sky-300 hover:text-sky-200"
                      >
                        View charts <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </Reveal>
            </div>
          </section>
        </Reveal>

        {/* Governance / Disclosures */}
        <Reveal>
          <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 md:p-8 backdrop-blur">
            <h2 className="text-2xl font-semibold text-white">Governance & disclosures</h2>
            <p className="mt-2 text-sm text-white/70">
              We publish updates and maintain a clear record of changes and security posture.
            </p>

            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                "Quarterly updates posted on the IR News page.",
                "Security reports and risk notes published regularly.",
                "Community proposals posted in the public forum.",
                "Policy controls and signed requests to reduce abuse risk.",
              ].map((t, i) => (
                <li key={t} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                  <span className="mr-2 text-sky-300">•</span>
                  {t}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={"/ir/news" as any}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
              >
                <Newspaper className="h-4 w-4" />
                Read IR news
              </Link>
              <a
                href="mailto:ir@solink.network"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white/90 transition"
              >
                Email IR <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </section>
        </Reveal>

        <footer className="pb-4 text-center text-xs text-white/45">
          © {new Date().getFullYear()} Solink Network • Investor Relations
        </footer>
      </div>
    </main>
  );
}
