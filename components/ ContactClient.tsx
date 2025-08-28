// components/ContactClient.tsx
'use client';

import { useState } from 'react';

export default function ContactClient({ locale }: { locale: string }) {
  const [submitted, setSubmitted] = useState(false);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">Contact / Demo</h1>
      <p className="mt-4 text-slate-300">
        Tell us about your use case and we’ll tailor a demo for your team.
      </p>

      {!submitted ? (
        <form
          className="mt-8 space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm text-slate-300">Full name</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                required
              />
            </div>
            <div>
              <label className="text-sm text-slate-300">Company</label>
              <input className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm text-slate-300">Work email</label>
              <input
                type="email"
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                required
              />
            </div>
            <div>
              <label className="text-sm text-slate-300">Phone (optional)</label>
              <input className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100" />
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-300">Message</label>
            <textarea
              rows={5}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            />
          </div>

          <button className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20">
            Submit
          </button>
        </form>
      ) : (
        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-slate-200">
          Thanks! We’ll get back to you shortly.
        </div>
      )}

      <div className="mt-8 text-sm text-slate-400">
        Or email us directly:{' '}
        <a href="mailto:hello@yourdomain.com" className="text-cyan-400 hover:underline">
          hello@yourdomain.com
        </a>
      </div>
    </main>
  );
}
