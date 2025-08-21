export const locales = ['en', 'th', 'zh', 'ja', 'ko', 'es', 'it'] as const;
export type Locale = typeof locales[number];

export const defaultLocale: Locale = 'en';

export function isLocale(x: string | undefined): x is Locale {
  if (!x) return false;
  return (locales as readonly string[]).includes(x);
}