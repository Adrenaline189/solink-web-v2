import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "Help Center - Solink",
  description: "Learn how to get started with Solink, earn points, and use the node client.",
};

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-200">
      <Nav />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-emerald-400 mb-8">Help Center</h1>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-emerald-300 mb-4">📖 Quick Start</h2>
          <div className="space-y-4 text-slate-300">
            <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800">
              <h3 className="text-lg font-semibold text-white mb-2">1. Connect Wallet</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Go to <a href="https://solink.network" className="text-emerald-400 hover:underline">solink.network</a></li>
                <li>Click &quot;Connect Wallet&quot;</li>
                <li>Choose your Solana wallet (Phantom, Solflare, etc.)</li>
                <li>Approve the signature request</li>
              </ol>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800">
              <h3 className="text-lg font-semibold text-white mb-2">2. Download Extension</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Go to Chrome Web Store or our <a href="/download" className="text-emerald-400 hover:underline">download page</a></li>
                <li>Install &quot;Solink Browser Extension&quot;</li>
                <li>Open extension and login with your connected wallet</li>
              </ol>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800">
              <h3 className="text-lg font-semibold text-white mb-2">3. Start Earning</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Extension runs in background to share bandwidth</li>
                <li>Points credited every heartbeat (~45 seconds)</li>
                <li>View earnings on your <a href="/dashboard" className="text-emerald-400 hover:underline">dashboard</a></li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-emerald-300 mb-4">💰 How to Earn Points</h2>
          <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-emerald-400 border-b border-slate-700">
                  <th className="text-left py-2">Activity</th>
                  <th className="text-right py-2">Points</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                <tr className="border-b border-slate-800">
                  <td className="py-2">Running Extension</td>
                  <td className="text-right">1 point per minute</td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="py-2">Sharing 10 Mbps</td>
                  <td className="text-right">~500 pts/month</td>
                </tr>
                <tr>
                  <td className="py-2">Sharing 50 Mbps</td>
                  <td className="text-right">~3,000 pts/month</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-4 text-xs text-slate-500">
              <strong>Formula:</strong> Points/minute = Bandwidth_Mbps × 0.7
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-emerald-300 mb-4">💻 Node Client Setup</h2>
          <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Requirements</h3>
              <ul className="list-disc list-inside text-sm text-slate-300">
                <li>macOS, Linux, or Windows with WSL</li>
                <li>Node.js 18+</li>
                <li>Solana wallet (can be separate from main wallet)</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Installation</h3>
              <pre className="bg-slate-950 rounded-lg p-3 text-xs text-emerald-300 overflow-x-auto">{`# Clone the repository
git clone https://github.com/Adrenaline189/solink-web-v2
cd solink-web-v2/apps/node-client

# Install dependencies
npm install

# Build
npm run build`}</pre>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Configuration</h3>
              <p className="text-sm text-slate-300 mb-2">Create a <code className="bg-slate-800 px-1 rounded">.env</code> file:</p>
              <pre className="bg-slate-950 rounded-lg p-3 text-xs text-emerald-300 overflow-x-auto">{`WALLET_PRIVATE_KEY=<your-wallet-private-key>
SOLINK_API_URL=https://solink.network`}</pre>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Run</h3>
              <pre className="bg-slate-950 rounded-lg p-3 text-xs text-emerald-300 overflow-x-auto">node dist/index.js</pre>
              <p className="mt-2 text-xs text-slate-400">The client will measure bandwidth, send heartbeat every 15 minutes, and earn points automatically.</p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-emerald-300 mb-4">🎁 Referral Program</h2>
          <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800">
            <h3 className="text-lg font-semibold text-white mb-2">How It Works</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-slate-300 mb-4">
              <li>Copy your referral link from your <a href="/dashboard" className="text-emerald-400 hover:underline">dashboard</a></li>
              <li>Share with friends</li>
              <li>When they sign up with your link:
                <ul className="ml-6 mt-1 space-y-1">
                  <li>🎉 <strong className="text-white">You get 100 points</strong> instantly</li>
                  <li>💎 <strong className="text-white">You get 3%</strong> of all points they earn forever</li>
                </ul>
              </li>
            </ol>
            <div className="bg-slate-800/50 rounded-lg p-3 text-sm">
              <p className="text-slate-400">Your referral code = first 8 characters of your wallet address (uppercase)</p>
              <p className="text-emerald-400 mt-1">Example: Wallet <span className="font-mono">58p7bc25e2gF...</span> → Code: <span className="font-mono font-bold">58P7BC25</span></p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-emerald-300 mb-4">📊 Dashboard Overview</h2>
          <div className="grid gap-4">
            <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800">
              <h3 className="text-lg font-semibold text-white mb-2">Points Today</h3>
              <ul className="text-sm text-slate-300 space-y-1">
                <li><span className="text-emerald-400">Today</span> — Your points earned today</li>
                <li><span className="text-emerald-400">Yesterday</span> — Points earned yesterday</li>
              </ul>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800">
              <h3 className="text-lg font-semibold text-white mb-2">System Status</h3>
              <ul className="text-sm text-slate-300 space-y-1">
                <li><span className="text-emerald-400">Region</span> — Server region you&apos;re connected to</li>
                <li><span className="text-emerald-400">Latency</span> — Connection delay (ms)</li>
                <li><span className="text-emerald-400">Version</span> — Node/Extension version</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-emerald-300 mb-4">❓ FAQ</h2>
          <div className="space-y-4">
            <details className="bg-slate-900/50 rounded-xl p-5 border border-slate-800">
              <summary className="font-semibold text-white cursor-pointer">Do I need SOL to use Solink?</summary>
              <p className="mt-2 text-sm text-slate-300">No, SOL is only needed for transaction fees when you eventually convert points to SLK.</p>
            </details>
            <details className="bg-slate-900/50 rounded-xl p-5 border border-slate-800">
              <summary className="font-semibold text-white cursor-pointer">How is bandwidth measured?</summary>
              <p className="mt-2 text-sm text-slate-300">We measure actual download/upload speed when the extension/node is active.</p>
            </details>
            <details className="bg-slate-900/50 rounded-xl p-5 border border-slate-800">
              <summary className="font-semibold text-white cursor-pointer">Can I run both Extension and Node Client?</summary>
              <p className="mt-2 text-sm text-slate-300">Yes! They work independently and both earn points.</p>
            </details>
            <details className="bg-slate-900/50 rounded-xl p-5 border border-slate-800">
              <summary className="font-semibold text-white cursor-pointer">When can I convert points to SLK?</summary>
              <p className="mt-2 text-sm text-slate-300">After Token Generation Event (TGE), expected Q4 2026.</p>
            </details>
          </div>
        </section>

        <section className="text-center py-8 border-t border-slate-800">
          <p className="text-slate-400">Still have questions?</p>
          <p className="text-slate-500 text-sm mt-2">Email: support@solink.network</p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
