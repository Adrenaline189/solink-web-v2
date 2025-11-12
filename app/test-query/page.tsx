"use client";
import { useQuery } from "@tanstack/react-query";

export default function TestQueryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["hello"],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 1000));
      return "Hello from React Query";
    },
  });

  return (
    <div className="p-6 text-slate-200">
      {isLoading ? "Loading…" : `✅ ${data}`}
    </div>
  );
}
