// lib/hooks/useMetrics.ts
import { useQuery } from "@tanstack/react-query";

export type HourRow = { hourUtc: string; pointsEarned: number };
export type MetricsResp = {
  ok: boolean;
  daily: { dayUtc: string; pointsEarned: number } | null;
  hourly: HourRow[];
};

export function useMetrics() {
  return useQuery<MetricsResp>({
    queryKey: ["metrics", "today"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/metrics", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch /api/dashboard/metrics");
      return res.json();
    },
    refetchInterval: 30_000, // รีเฟรชทุก 30 วินาที
    refetchOnWindowFocus: true,
  });
}
