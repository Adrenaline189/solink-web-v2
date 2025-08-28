// components/Footer.tsx
import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-800 mt-12">
      <div className="mx-auto max-w-7xl px-6 py-8 grid gap-6 sm:grid-cols-2 md:grid-cols-4">
        {/* Brand */}
        <div>
          <div className="text-slate-200 font-semibold">Solink</div>
          <p className="text-slate-400 text-sm mt-2">
            Share bandwidth. Earn rewards.
          </p>
        </div>

        {/* Product / Site nav */}
        <div className="text-sm space-y-2">
          <div className="text-slate-400">Product</div>
          <div className="flex flex-wrap gap-4 text-slate-300">
            <Link href="/product" className="hover:text-sky-300">Product</Link>
            <Link href="/solutions" className="hover:text-sky-300">Solutions</Link>
            <Link href="/pricing" className="hover:text-sky-300">Pricing</Link>
            <Link href="/resources" className="hover:text-sky-300">Resources</Link>
            <Link href="/ir" className="hover:text-sky-300">IR</Link>
            <Link href="/contact" className="hover:text-sky-300">Contact</Link>
          </div>
        </div>

        {/* Developers */}
        <div className="text-sm space-y-2">
          <div className="text-slate-400">Developers</div>
          <div className="flex flex-col gap-2 text-slate-300">
            <Link href="/developers" className="hover:text-sky-300">Overview</Link>
            <Link href="/docs" className="hover:text-sky-300">API Docs</Link>
            <Link href="/status" className="hover:text-sky-300">Status</Link>
            <Link href="/changelog" className="hover:text-sky-300">Changelog</Link>
          </div>
        </div>

        {/* Legal */}
        <div className="text-sm space-y-2 md:text-right">
          <div className="text-slate-400">Legal</div>
          <div className="flex flex-wrap gap-4 md:justify-end text-slate-300">
            <Link href="/terms" className="hover:text-sky-300">Terms</Link>
            <Link href="/privacy" className="hover:text-sky-300">Privacy</Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-8 text-xs text-slate-500">
        © {year} Solink. All rights reserved.
      </div>
    </footer>
  );
}
