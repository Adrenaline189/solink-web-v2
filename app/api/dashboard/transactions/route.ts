// app/api/dashboard/transactions/route.ts
import { NextResponse } from "next/server";
import { apiGet } from "@/lib/server/api";

export const dynamic = "force-dynamic";

const DEMO_TX = [
  { ts: "2025-08-15 14:30", type: "Accrual",  amount: "+120 pts",            note: "Uptime slot bonus" },
  { ts: "2025-08-15 13:10", type: "Convert",  amount: "-1,000 pts → +1 SLK", note: "Conversion" },
  { ts: "2025-08-15 12:55", type: "Referral", amount: "+50 pts",             note: "Invite accepted" },
  { ts: "2025-08-15 11:05", type: "Accrual",  amount: "+80 pts",             note: "Usage accrual" },
];

export async function GET(_req: Request) {
  try {
    const json = await apiGet<{ ok: boolean; events: Array<{ createdAt: string; type: string; amount: number; meta?: any }> }>(
      "/api/points/events?limit=30"
    );

    const tx = (json?.events || []).map((e) => {
      const d = new Date(e.createdAt);
      const ts = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
      const type =
        e.type === "extension_farm" ? "Accrual" :
        e.type === "referral_bonus" ? "Referral" :
        e.type;
      const amount =
        e.type === "extension_farm" || e.type === "referral_bonus"
          ? `+${e.amount} pts`
          : String(e.amount);
      const note =
        e.type === "referral_bonus" && e.meta?.referredUserId
          ? `Referral: ${e.meta.referredUserId}`
          : e.meta?.reason || "";
      return { ts, type, amount, note };
    });

    return NextResponse.json({ ok: true, tx });
  } catch {
    return NextResponse.json({ ok: true, tx: DEMO_TX });
  }
}
