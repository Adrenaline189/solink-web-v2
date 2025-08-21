'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

type Item = { label: string; href: string };

export default function MobileMenu({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node | null;
      if (panelRef.current?.contains(t as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };

    if (open) {
      document.addEventListener('pointerdown', onPointerDown);
      document.addEventListener('keydown', onKey);
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = '';
    };
  }, [open]);

  const ariaExpanded: 'true' | 'false' = open ? 'true' : 'false';

  return (
    <>
      <button
        aria-label="Open menu"
        aria-haspopup="menu"
        aria-controls="mobile-menu"
        aria-expanded={ariaExpanded}
        onClick={() => setOpen(true)}
        className="md:hidden inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900/60 p-2 hover:bg-slate-800"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        className={`fixed inset-0 z-50 md:hidden transition-opacity ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div
          ref={panelRef}
          className={`absolute right-0 top-0 h-full w-80 max-w-[85%] transform border-l border-slate-800 bg-slate-950 p-4 shadow-2xl transition-transform ${open ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-300">Menu</span>
            <button
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="rounded-lg p-2 hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="grid gap-1">
            {items.map((it) => {
              const active = pathname === it.href;
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-xl px-3 py-2 text-base ${active ? 'bg-slate-800 text-white' : 'text-slate-200 hover:bg-slate-800/70'}`}
                >
                  {it.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}
