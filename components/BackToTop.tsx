'use client';
import { useEffect, useState } from 'react';

export default function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  if (!show) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-40 rounded-full border border-slate-700 bg-slate-900/80
                 px-3 py-2 text-sm text-slate-200 shadow-xl hover:bg-slate-800 backdrop-blur"
      aria-label="Back to top"
    >
      ↑ Top
    </button>
  );
}
