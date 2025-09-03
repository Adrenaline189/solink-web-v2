// components/Footer.tsx
import Link from "next/link";
import { Twitter, Send, MessageCircle } from "lucide-react";

export default function Footer() {
  const socials = [
    { key: "x", label: "X (Twitter)", href: "/", icon: <Twitter size={18} aria-hidden="true" /> },
    { key: "telegram", label: "Telegram", href: "/", icon: <Send size={18} aria-hidden="true" /> },
    // ใช้ MessageCircle แทน Discord ชั่วคราว
    { key: "discord", label: "Discord", href: "/", icon: <MessageCircle size={18} aria-hidden="true" /> }
  ] as const;

  return (
    <footer className="border-t border-slate-800 mt-12">
      <div className="mx-auto max-w-7xl px-6 py-10 grid gap-8 sm:grid-cols-3 lg:grid-cols-4">
        {/* Brand + Socials */}
        <div>
          <div className="text-slate-200 font-semibold">Solink</div>
          <p className="text-slate-400 text-sm mt-2">
            Share bandwidth. Earn rewards.
          </p>

          <div className="mt-4 flex items-center gap-3">
            {socials.map((s) => (
              <Link
                key={s.key}
                href={s.href}
                aria-label={s.label}
                title={s.label}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 hover:bg-white/5"
              >
                {s.icon}
              </Link>
            ))}
          </div>
        </div>

        {/* Product */}
        <div className="text-sm space-y-2">
          <div className="text-slate-400">Product</div>
          <div className="flex flex-col gap-2 text-slate-300">
            <Link href="/pricing" className="hover:text-sky-300">Pricing</Link>
            <Link href="/resources" className="hover:text-sky-300">Resources</Link>
            <Link href="/company" className="hover:text-sky-300">Company</Link>
            <Link href="/contact" className="hover:text-sky-300">Contact</Link>
          </div>
        </div>

        {/* Developers */}
        <div className="text-sm space-y-2">
          <div className="text-slate-400">Developers</div>
          <div className="flex flex-col gap-2 text-slate-300">
            <Link href="/resources#api" className="hover:text-sky-300">API</Link>
            <Link href="/resources#sdk" className="hover:text-sky-300">SDK &amp; Tools</Link>
            <Link href="/resources#status" className="hover:text-sky-300">Status</Link>
            <Link href="/resources#changelog" className="hover:text-sky-300">Changelog</Link>
          </div>
        </div>

        {/* Legal */}
        <div className="text-sm space-y-2 lg:text-right">
          <div className="text-slate-400">Legal</div>
          <div className="flex flex-col gap-2 text-slate-300 lg:items-end">
            <Link href="/terms" className="hover:text-sky-300">Terms</Link>
            <Link href="/privacy" className="hover:text-sky-300">Privacy</Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-8 text-xs text-slate-500">
        © {new Date().getFullYear()} Solink. All rights reserved.
      </div>
    </footer>
  );
}
