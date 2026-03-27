"use client";
import { useState } from "react";
import { X, Download, Zap } from "lucide-react";

export default function ExtensionDownloadBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative rounded-2xl border border-amber-700/50 bg-gradient-to-r from-amber-950/40 to-orange-950/40 p-4 mb-4 overflow-hidden">
      {/* Glow accent */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-orange-500/5 pointer-events-none" />

      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-slate-500 hover:text-white transition"
        aria-label="Dismiss"
      >
        <X className="size-4" />
      </button>

      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-amber-900/40 border border-amber-700/50 p-2.5 shrink-0">
          <Zap className="size-6 text-amber-400" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white mb-1">
            Earn More with the Solink Browser Extension
          </h3>
          <p className="text-sm text-slate-300 mb-3">
            Install the extension to earn <span className="text-amber-400 font-semibold">up to 3× more points</span> from automatic bandwidth sharing while you browse.
          </p>

          <div className="flex flex-wrap gap-3">
            <a
              href="https://chrome.google.com/webstore"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600/80 hover:bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition"
            >
              <Download className="size-4" />
              Download for Chrome
            </a>
            <a
              href="https://addons.mozilla.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 hover:border-slate-500 px-4 py-2 text-sm font-semibold text-slate-300 transition"
            >
              Firefox
            </a>
          </div>
        </div>
      </div>

      {/* Features list */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 ml-14">
        {[
          "Auto earnings while browsing",
          "Up to 3× faster point accumulation",
          "Real-time bandwidth monitoring",
          "Easy install — no setup required",
        ].map((feat) => (
          <span key={feat} className="flex items-center gap-1">
            <span className="text-amber-500">✓</span> {feat}
          </span>
        ))}
      </div>
    </div>
  );
}
