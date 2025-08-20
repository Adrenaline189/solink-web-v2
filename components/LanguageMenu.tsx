'use client';
import { useEffect, useRef, useState } from 'react';
import { useLang } from '@/lib/useLang';
import { ChevronDown } from 'lucide-react';

const labels: Record<string, string> = {
  en: 'English',
  zh: '中文',
  ko: '한국어',
  ja: '日本語',
  th: 'ไทย',
  es: 'Español',
  it: 'Italiano',
};

const codes = ['en', 'zh', 'ko', 'ja', 'th', 'es', 'it'] as const;
type Code = typeof codes[number];

export default function LanguageMenu() {
  const [lang, setLang] = useLang(); // [string, (v:string)=>void]
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [activeIndex, setActiveIndex] = useState<number>(
    Math.max(0, codes.findIndex((c) => c === (lang as Code)))
  );

  // sync activeIndex เมื่อภาษาเปลี่ยน
  useEffect(() => {
    setActiveIndex(Math.max(0, codes.findIndex((c) => c === (lang as Code))));
  }, [lang]);

  // ปิดเมื่อคลิกนอก / กด Esc
  useEffect(() => {
    const onPointerDown = (e: MouseEvent | PointerEvent) => {
      if (!rootRef.current) return;
      const target = e.target as Node | null;
      if (target && rootRef.current.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown as any);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown as any);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // โฟกัสรายการเมื่อเปิด
  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      listRef.current?.focus();
      const el = listRef.current?.querySelector<HTMLButtonElement>(
        `[data-index="${activeIndex}"]`
      );
      el?.scrollIntoView({ block: 'nearest' });
    });
  }, [open, activeIndex]);

  const selectLang = (c: Code) => {
    setLang(c);
    setOpen(false);
    btnRef.current?.focus();
  };

  const moveActive = (delta: number) => {
    setActiveIndex((i) => (i + delta + codes.length) % codes.length);
  };

  return (
    <div ref={rootRef} data-lang-menu-root="true" className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/60"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls="lang-listbox"
      >
        <span className="opacity-80">Language:</span>
        <strong>{labels[lang] ?? 'English'}</strong>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <div
        className={`absolute right-0 top-full mt-2 z-50 w-56 rounded-2xl border border-slate-700
                    bg-slate-900/95 backdrop-blur shadow-xl shadow-black/30 origin-top
                    transition-[opacity,transform] duration-150 ease-out
                    ${open ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'}
                    motion-reduce:transition-none`}
        style={{ transformOrigin: 'top' }}
      >
        <ul
          id="lang-listbox"
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          aria-activedescendant={open ? `lang-opt-${activeIndex}` : undefined}
          className="p-2 outline-none max-h-64 overflow-auto"
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              moveActive(1);
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              moveActive(-1);
            } else if (e.key === 'Home') {
              e.preventDefault();
              setActiveIndex(0);
            } else if (e.key === 'End') {
              e.preventDefault();
              setActiveIndex(codes.length - 1);
            } else if (e.key === 'Enter') {
              e.preventDefault();
              selectLang(codes[activeIndex] as Code);
            } else if (e.key === 'Tab') {
              setOpen(false);
            }
          }}
        >
          {codes.map((c, i) => {
            const isSelected = lang === c;
            const isActive = i === activeIndex;
            return (
              <li key={c} role="option" aria-selected={isSelected} id={`lang-opt-${i}`}>
                <button
                  type="button"
                  data-index={i}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => selectLang(c)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm outline-none
                    ${isSelected ? 'bg-blue-600 text-white' : 'text-slate-200 hover:bg-slate-800/70'}
                    ${isActive && !isSelected ? 'ring-1 ring-slate-600' : ''}
                  `}
                >
                  {labels[c]}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
