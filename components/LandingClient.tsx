// components/LandingClient.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import React from "react";

type Props = {
  /** เคยรับไว้ตอนมี i18n; ตอนนี้ไม่จำเป็นต้องใช้ */
  locale?: string;
};

export default function LandingClient(_props: Props) {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 py-16 text-center">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Share bandwidth. Earn rewards.
            </h1>
            <p className="mt-4 text-slate-400">
              Solink makes bandwidth sharing simple, secure, and rewarding.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              {/* ✅ ใช้เส้นทางตรงเพื่อให้ผ่าน typedRoutes */}
              <Link
                href="/contact"
                className="rounded-2xl bg-cyan-500 px-6 py-3 text-lg font-semibold text-white shadow-lg hover:bg-cyan-600"
              >
                Get started
              </Link>

              <Link
                href="/dashboard"
                className="rounded-2xl border border-slate-700 px-6 py-3 text-lg hover:bg-slate-800"
              >
                Open dashboard
              </Link>

              <Link
                href="/pricing"
                className="rounded-2xl border border-slate-700 px-6 py-3 text-lg hover:bg-slate-800"
              >
                View pricing
              </Link>
            </div>
          </div>

          {/* Illustration placeholder (ลบได้ถ้าไม่ใช้) */}
          <div className="pointer-events-none relative mx-auto mt-12 aspect-[16/9] w-full max-w-5xl rounded-2xl border border-slate-800 bg-slate-900/40">
            <div className="absolute inset-0 grid place-items-center text-slate-500">
              <span className="text-sm">Landing Illustration</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature highlights (สั้นๆ) */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Feature
            title="Plug & Earn"
            desc="Start sharing in minutes—no network expertise required."
          />
          <Feature
            title="Privacy-first"
            desc="Traffic isolation and strict sandboxing keep you safe."
          />
          <Feature
            title="Fair rewards"
            desc="Earn points based on uptime, quality and bandwidth."
          />
        </div>
      </section>
    </div>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
      <div className="text-lg font-semibold">{title}</div>
      <p className="mt-2 text-sm text-slate-400">{desc}</p>
    </div>
  );
}
