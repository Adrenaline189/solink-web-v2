import type { Metadata } from 'next';
import PricingClient from '@/components/PricingClient';

export const metadata: Metadata = {
  title: 'Pricing — Solink',
  description: 'Plans and pricing.',
  robots: { index: false, follow: false },
};

export default function PricingPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <PricingClient locale={locale} />
    </main>
  );
}
