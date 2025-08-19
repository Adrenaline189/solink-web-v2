'use client';
import en from '@/locales/en.json';
import zh from '@/locales/zh.json';
import ko from '@/locales/ko.json';
import ja from '@/locales/ja.json';
import th from '@/locales/th.json';
import es from '@/locales/es.json';
import it from '@/locales/it.json';
import type { Lang } from './useLang';

const dict: Record<Lang, Record<string,string>> = { en, zh, ko, ja, th, es, it };

export function t(lang: Lang, key: string): string {
  return (dict[lang] && dict[lang][key]) || key;
}
