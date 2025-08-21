'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { NavItem } from '@/lib/nav';

export default function MainNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="hidden md:flex items-center gap-6 text-sm">
      {items.map((i) => {
        const active = pathname === i.href;
        return (
          <Link
            key={i.href}
            href={i.href}
            className={
              active
                ? 'text-white'
                : 'text-slate-300 hover:text-white transition-colors'
            }
            aria-current={active ? 'page' : undefined}
          >
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
