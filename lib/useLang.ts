'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const SUPPORTED = ['en','zh','ko','ja','th','es','it'] as const;
export type Lang = typeof SUPPORTED[number];
const DEFAULT_LANG: Lang = 'en';

export function useLang(): [Lang, (lang: Lang)=>void, boolean] {
  const search = useSearchParams();
  const router = useRouter();
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);
  const [ready, setReady] = useState(false);

  useEffect(()=>{
    const fromQuery = search.get('lang');
    const fromStorage = typeof window !== 'undefined' ? window.localStorage.getItem('lang') : null;
    const pick =
      (fromQuery && SUPPORTED.includes(fromQuery as Lang)) ? fromQuery as Lang :
      (fromStorage && SUPPORTED.includes(fromStorage as Lang)) ? fromStorage as Lang :
      DEFAULT_LANG;
    setLangState(pick);
    setReady(true);
  }, [search]);

  const setLang = (l: Lang) => {
    if (!SUPPORTED.includes(l)) return;
    if (typeof window !== 'undefined') window.localStorage.setItem('lang', l);
    const url = new URL(window.location.href);
    url.searchParams.set('lang', l);
    router.push(url.pathname + '?' + url.searchParams.toString());
  };

  return [lang, setLang, ready];
}
