'use client';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <main className="mx-auto max-w-3xl px-6 py-24 text-center text-slate-300">
          <h1 className="text-4xl font-semibold text-white">App crashed</h1>
          <p className="mt-3 text-slate-400">{error.message || 'Unexpected error.'}</p>
          <button
            onClick={() => reset()}
            className="mt-6 rounded-xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
          >
            Reload
          </button>
        </main>
      </body>
    </html>
  );
}
