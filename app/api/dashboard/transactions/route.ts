// app/api/dashboard/transactions/route.ts
import { NextResponse } from "next/server";
import { API_BASE } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const r = await fetch(`${API_BASE}/api/points/events?limit=20`, {
      credentials: "include",
      cache: "no-store",
    });
    if (!r.ok) throw new Error("upstream error");
    const data = (await r.json()) as {
      ok: boolean;
      events?: Array<{ createdAt: string; type: string; amount: number }>;
    };

    const tx =
      (data.events || []).map((e) => ({
        ts: new Date(e.createdAt).toISOString().replace("T", " ").slice(0, 16),
        type: e.type === "referral_bonus" ? "Referral" : "Accrual",
        amount: `${e.amount > 0 ? "+" : ""}${e.amount} pts`,
        note: e.type === "referral_bonus" ? "Referral bonus" : "Earned",
      })) ?? [];

    if (tx.length === 0) throw new Error("empty");
    return NextResponse.json({ ok: true, tx }, { status: 200 });
  } catch {
    // demo
    return NextResponse.json(
      {
        ok: true,
        tx: [
          { ts: "2025-08-15 14:30", type: "Accrual",  amount: "+120 pts",            note: "Uptime slot bonus" },
          { ts: "2025-08-15 13:10", type: "Convert",  amount: "-1,000 pts → +1 SLK", note: "Conversion" },
          { ts: "2025-08-15 12:55", type: "Referral", amount: "+50 pts",             note: "Invite accepted" },
          { ts: "2025-08-15 11:05", type: "Accrual",  amount: "+80 pts",             note: "Usage accrual" },
        ],
      },
      { status: 200 }
    );
  }
}
