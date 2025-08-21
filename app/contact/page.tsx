import type { Metadata } from 'next';
import ContactClient from './Client'; // ✅ relative import, ไม่พึ่ง '@/...'

export const metadata: Metadata = {
  title: 'Contact / Demo — Solink',
  description: 'Get in touch or request a demo.',
  robots: { index: false, follow: false },
};

export default function ContactPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  return <ContactClient locale={locale} />;
}