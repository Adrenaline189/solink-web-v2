// app/page.tsx
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function Root() {
  // Redirect root -> /en (รองรับโครงหลายภาษาที่เราใช้)
  redirect('/en');
}
