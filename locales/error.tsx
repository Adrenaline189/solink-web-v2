'use client';

export default function LocaleError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24 text-center text-slate-300">
      <h1 className="text-4xl font-semibold text-white">Something went wrong</h1>
      <p className="mt-3 text-slate-400">{error.message || 'Unexpected error.'}</p>
      <button
        onClick={() => reset()}
        className="mt-6 rounded-xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
      >
        Try again
      </button>
    </main>
  );
}
