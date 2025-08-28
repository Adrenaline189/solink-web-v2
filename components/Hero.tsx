// components/Hero.tsx
import Link from "next/link";
import Image from "next/image";

type Props = {
  /** เคยใช้ตอนมี i18n prefix; ตอนนี้ไม่บังคับ */
  locale?: string;
};

export default function Hero({ locale }: Props) {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 py-16 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Share bandwidth. Earn rewards.
          </h1>
          <p className="mt-4 text-slate-400">
            Solink makes bandwidth sharing simple, secure, and rewarding.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {/* ✅ ไม่มี i18n prefix แล้ว; ใช้เส้นทางตรงให้เข้ากับ typedRoutes */}
            <Link
              href="/contact"
              className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
            >
              Request a demo
            </Link>

            <Link
              href="/dashboard"
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
            >
              Open dashboard
            </Link>
          </div>
        </div>

        {/* ตัวอย่างภาพประกอบ (ถ้าไม่ใช้ลบออกได้) */}
        <div className="pointer-events-none relative mx-auto mt-12 aspect-[16/9] w-full max-w-5xl rounded-2xl border border-slate-800 bg-slate-900/40">
          <div className="absolute inset-0 grid place-items-center text-slate-500">
            {/* ใส่ภาพจริงของคุณได้ที่นี่ */}
            <span className="text-sm">Hero Illustration</span>
          </div>
        </div>
      </div>
    </section>
  );
}
