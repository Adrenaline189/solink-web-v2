// components/NewsLink.tsx
import Link from "next/link";
import type { Route } from "next";

type Props = {
  slug: string;
  children: React.ReactNode;
  className?: string;
  prefetch?: boolean;
};

// ให้ href เป็นรูปแบบคงที่ /ir/news/${string} เพื่อผ่าน typedRoutes
type NewsPath = `/ir/news/${string}`;

export default function NewsLink({ slug, children, className, prefetch }: Props) {
  const href = `/ir/news/${encodeURIComponent(slug)}` as NewsPath as Route;
  return (
    <Link href={href} className={className} prefetch={prefetch}>
      {children}
    </Link>
  );
}
