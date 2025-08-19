'use client';
import { useEffect, useState } from 'react';
import { useLang } from '@/lib/useLang';
import { ChevronDown } from 'lucide-react';

const labels: Record<string,string> = {
  en: 'English', zh: '中文', ko: '한국어', ja: '日本語', th: 'ไทย', es: 'Español', it: 'Italiano'
};

export default function LanguageMenu() {
  const [lang, setLang] = useLang();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (!el.closest?.('[data-lang-menu-root="true"]')) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', onClick); document.removeEventListener('keydown', onKey); };
  }, []);

  const codes = ['en','zh','ko','ja','th','es','it'] as const;

  return (
    <div data-lang-menu-root="true" className="relative">
      <button
        onClick={()=>setOpen(o=>!o)}
        className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-sm hover:bg-slate-800"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="opacity-80">Language:</span>
        <strong>{labels[lang]}</strong>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <div
        role="menu"
        className={`absolute right-0 top-full mt-2 z-50 w-56 rounded-2xl border border-slate-700
                    bg-slate-900/95 backdrop-blur shadow-xl shadow-black/30 origin-top
                    transform transition-[opacity,transform] duration-200 ease-out
                    ${open ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'}`}
        style={{ transformOrigin: 'top' }}
      >
        <ul className="p-2">
          {codes.map(c => (
            <li key={c}>
              <button
                onClick={()=>{ setLang(c); setOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm
                           ${lang===c ? 'bg-blue-600 text-white' : 'text-slate-200 hover:bg-slate-800/70'}`}
                role="menuitem"
              >
                {labels[c]}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
