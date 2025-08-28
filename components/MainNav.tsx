// components/MainNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { key: string; label: string; href: `/${string}` };

export default function MainNav({ items }: { items: ReadonlyArray<NavItem> }) {
  const pathname = usePathname() || "/";

  return (
    <nav className="hidden md:flex items-center gap-6">
      {items.map((it) => {
        const active =
          it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);

        return (
          <Link
            key={it.key}
            href={it.href as any} // กันชน typedRoutes
            aria-current={active ? "page" : undefined}
            className={[
              "group relative px-1 py-2 transition-colors",
              active
                ? "font-medium text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-indigo-400"
                : "text-slate-300 hover:text-slate-100",
            ].join(" ")}
          >
            <span>{it.label}</span>

            {/* Animated gradient underline */}
            <span
              aria-hidden="true"
              className={[
                "pointer-events-none absolute left-0 -bottom-0.5 h-[2px] w-full rounded-full",
                "bg-gradient-to-r from-cyan-400 to-indigo-500",
                "origin-left transform transition-transform transition-opacity duration-300 ease-out",
                "opacity-0 scale-x-0",
                "group-hover:opacity-100 group-hover:scale-x-100",
                active ? "!opacity-100 !scale-x-100" : "",
              ].join(" ")}
            />
          </Link>
        );
      })}
    </nav>
  );
}
