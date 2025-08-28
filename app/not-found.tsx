// app/not-found.tsx
export default function NotFound() {
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
      <h1 className="text-4xl font-bold">Page not found</h1>
      <p className="text-slate-400 mt-2">The page you’re looking for doesn’t exist or was moved.</p>
      <a href="/" className="mt-6 rounded-xl border border-slate-700 px-4 py-2 hover:bg-slate-800">
        Back to home
      </a>
    </main>
  );
}
