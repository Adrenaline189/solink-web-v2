// lib/ir-content.ts
export const IR_CONTENT = {
  kpis: [
    { label: 'Monthly Active Users', value: '24,600', sub: 'Last 30 days' },
    { label: 'Revenue (USD)', value: '$73,400', sub: 'Trailing 30 days' },
    { label: 'Burn (USD/mo)', value: '$92,000', sub: 'Ops + R&D' },
    { label: 'Runway (months)', value: '14', sub: 'At current burn' },
  ],
  docs: [
    { name: 'Whitepaper', href: '/docs/whitepaper.pdf' },
    { name: 'One-pager', href: '/docs/one-pager.pdf' },
    { name: 'Tokenomics (overview)', href: '/docs/tokenomics.pdf' },
    { name: 'Pitch deck (public)', href: '/docs/pitch.pdf' },
  ],
  updates: [
    { date: '2025-08-01', title: 'Q2 Update: Network growth & reward calibration', href: '#' },
    { date: '2025-06-18', title: 'Mainnet beta rollout across 3 regions', href: '#' },
    { date: '2025-05-20', title: 'Partnership: CDN aggregator pilot', href: '#' },
  ],
  earnings: [
    {
      quarter: 'Q3 2025 (demo)',
      call: '2025-11-12 17:00 UTC',
      materials: ['Slides', 'Transcript'],
    },
    { quarter: 'Q2 2025 (demo)', call: '2025-08-08 17:00 UTC', materials: ['Slides'] },
  ],
  governance: {
    ticker: 'SLK',
    unlockScheduleHref: '#',
    daoPortalHref: '#',
  },
  irPackHref: '/docs/solink-investor-pack.zip',
  contactHref: '/contact',
  contactEmail: 'ir@solink.network',
} as const;
