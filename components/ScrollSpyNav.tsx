'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type Item = { id: string; label: string };

export default function ScrollSpyNav({ items }: { items: Item[] }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActive(visible.target.id);
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: [0.2, 0.4, 0.6, 0.8] }
    );
    items.forEach((it) => {
      const el = document.getElementById(it.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [items]);

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="sticky top-12 z-30 border-b border-slate-800 bg-slate-950/70 backdrop-blur">
      <nav
        className="mx-auto flex max-w-7xl items-center gap-4 overflow-x-auto px-6 py-2 text-sm
                      [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        <style jsx>{`
          nav::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {items.map((it) => {
          const isActive = active === it.id;
          return (
            <Link
              key={it.id}
              href={`#${it.id}`}
              onClick={(e) => onClick(e, it.id)}
              className={`rounded-full px-3 py-1.5 whitespace-nowrap transition-colors
                ${isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:text-white'}`}
              aria-current={isActive ? 'true' : undefined}
            >
              {it.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
