"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = { key: string; label: string; href: `/${string}` };
type NavGroup = { key: string; label: string; children: ReadonlyArray<NavLink> };
type NavItem = NavLink | NavGroup;

function isGroup(item: NavItem): item is NavGroup {
  return "children" in item;
}

export default function MainNav({ items }: { items: ReadonlyArray<NavItem> }) {
  const pathname = usePathname() || "/";

  return (
    <nav className="hidden md:flex items-center gap-6">
      {items.map((it) => {
        /* ---------- GROUP (Resources) ---------- */
        if (isGroup(it)) {
          const active = it.children.some((c) =>
            pathname.startsWith(c.href)
          );

          return (
            <div
              key={it.key}
              className="relative group"
            >
              {/* 🔹 Parent (ขยาย hover area ลงด้านล่าง) */}
              <button
                type="button"
                aria-current={active ? "page" : undefined}
                className={[
                  "group relative px-1 pt-2 pb-4 transition-colors flex items-center gap-1",
                  active
                    ? "font-medium text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-indigo-400"
                    : "text-slate-300 hover:text-slate-100",
                ].join(" ")}
              >
                <span>{it.label}</span>
                <span className="text-xs opacity-60">▾</span>

                {/* underline */}
                <span
                  aria-hidden="true"
                  className={[
                    "pointer-events-none absolute left-0 bottom-1 h-[2px] w-full rounded-full",
                    "bg-gradient-to-r from-cyan-400 to-indigo-500",
                    "origin-left transform transition-transform transition-opacity duration-300 ease-out",
                    active ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0",
                  ].join(" ")}
                />
              </button>

              {/* 🔹 Dropdown (ดึงขึ้นมาซ้อน parent) */}
              <div
                className={[
                  "absolute left-0 z-50",
                  "-mt-2", // 🔥 สำคัญ: ปิด gap
                  "hidden group-hover:block",
                ].join(" ")}
              >
                <div className="rounded-xl border border-white/10 bg-black/90 p-2 shadow-xl backdrop-blur min-w-[220px]">
                  {it.children.map((child) => {
                    const childActive = pathname.startsWith(child.href);

                    return (
                      <Link
                        key={child.key}
                        href={child.href as any}
                        className={[
                          "block rounded-lg px-4 py-2 text-sm transition-colors",
                          childActive
                            ? "bg-white/10 text-white"
                            : "text-white/80 hover:bg-white/10 hover:text-white",
                        ].join(" ")}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        }

        /* ---------- NORMAL LINK ---------- */
        const active =
          it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);

        return (
          <Link
            key={it.key}
            href={it.href as any}
            aria-current={active ? "page" : undefined}
            className={[
              "group relative px-1 py-2 transition-colors",
              active
                ? "font-medium text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-indigo-400"
                : "text-slate-300 hover:text-slate-100",
            ].join(" ")}
          >
            <span>{it.label}</span>

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
