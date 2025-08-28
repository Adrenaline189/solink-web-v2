// components/MobileMenu.tsx
"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import type { Route } from "next";

type NavItem = {
  key: string;
  href: Route | string;
  label: ReactNode;
};

export default function MobileMenu({ items }: { items: readonly NavItem[] | NavItem[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden relative">
      <button onClick={() => setOpen((v) => !v)} className="rounded-xl border border-slate-700 px-3 py-1.5 text-sm">
        Menu
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-700 bg-slate-900/70 backdrop-blur p-2">
          {items.map((it) => (
            <Link
              key={it.key}
              href={it.href as Route}
              className="block rounded-lg px-3 py-2 text-slate-200 hover:bg-slate-800"
              onClick={() => setOpen(false)}
            >
              {it.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
