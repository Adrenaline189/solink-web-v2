// app/api/dev/turbo-earn/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

/* ========================= Input Schema ========================= */
const BodySchema = z.object({
  wallets: z.array(z.string().min(1)).min(1),
  type: z.enum(["extension_farm", "referral_bonus"]),
  amount: z.number().int().min(1),
  bursts: z.number().int().min(1).max(200),
  concurrency: z.number().int().min(1).max(10),
  minDelayMs: z.number().int().min(0).default(300),
  jitterMs: z.number().int().min(0).default(200),
  stopAtCap: z.boolean().default(true),
});

type EarnType = z.infer<typeof BodySchema>["type"];

/* ========================= Config ========================= */
const API_BASE = process.env.SOLINK_API_URL || "https://api-solink.network";
const DAILY_CAP = 2000;

/* ========================= Helpers ========================= */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type FireResp = {
  ok: boolean;
  status: number;
  body: any;
};

async function fireEarn(
  token: string,
  type: EarnType,
  amount: number,
  meta: Record<string, any>
): Promise<FireResp> {
  try {
    const r = await fetch(`${API_BASE}/api/points/earn`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type, amount, meta }),
    });
    const body = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, body };
  } catch (e: any) {
    return { ok: false, status: 500, body: { error: e?.message || "Network error" } };
  }
}

/* ---------- retry + exponential backoff เมื่อโดน 429 ---------- */
const MAX_RETRIES = 5;
const BASE_BACKOFF = 300; // ms
async function fireEarnWithRetry(
  token: string,
  type: EarnType,
  amount: number,
  meta: Record<string, any>
): Promise<FireResp> {
  let attempt = 0;
  while (true) {
    const resp = await fireEarn(token, type, amount, meta);
    if (resp.ok || resp.status !== 429 || attempt >= MAX_RETRIES) return resp;

    const wait = BASE_BACKOFF * Math.pow(2, attempt) + Math.floor(Math.random() * 300);
    // eslint-disable-next-line no-console
    console.warn(`[turbo-earn] 429 rate-limited. retry #${attempt + 1} in ${wait}ms`);
    await sleep(wait);
    attempt++;
  }
}

/* ---------- ขอ demo token ต่อกระเป๋า ---------- */
async function loginWallet(wallet: string): Promise<string | null> {
  try {
    const r = await fetch(`${API_BASE}/api/auth/demo-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet }),
    });
    const data = await r.json().catch(() => ({}));
    return data?.token ?? null;
  } catch {
    return null;
  }
}

/* ========================= Route Handler ========================= */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = BodySchema.parse(body);

    const {
      wallets,
      type,
      amount,
      bursts,
      concurrency,
      minDelayMs,
      jitterMs,
      stopAtCap,
    } = input;

    // login ทุก wallet
    const tokens: Record<string, string> = {};
    for (const w of wallets) {
      const t = await loginWallet(w);
      if (!t) {
        return NextResponse.json(
          { ok: false, error: `Cannot login wallet ${w}` },
          { status: 401 }
        );
      }
      tokens[w] = t;
    }

    const summary: {
      wallets: string[];
      type: EarnType;
      amountPerShot: number;
      bursts: number;
      concurrency: number;
      perWalletBalance: Record<string, number>;
      totalEarned: number;
      dailyCap: number;
    } = {
      wallets,
      type,
      amountPerShot: amount,
      bursts,
      concurrency,
      perWalletBalance: {},
      totalEarned: 0,
      dailyCap: DAILY_CAP,
    };

    const samples: Array<{
      wallet: string;
      shot: number;
      resp: FireResp;
    }> = [];

    /* ---------- ยิงเป็น wallet ๆ พร้อมคุม concurrency ด้วย batch ---------- */
    for (const wallet of wallets) {
      const token = tokens[wallet];
      let balance = 0;

      const batch: Promise<void>[] = [];

      for (let i = 0; i < bursts; i++) {
        // หากเปิด stopAtCap และยอดถึงแล้ว ให้หยุด wallet นี้ทันที
        if (stopAtCap && balance >= DAILY_CAP) break;

        // สุ่ม delay ต่อช็อต
        const delay = minDelayMs + Math.floor(Math.random() * Math.max(1, jitterMs));
        await sleep(delay);

        const meta = {
          session: `dash-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          nonce: `dash-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        };

        const task = fireEarnWithRetry(token, type, amount, meta).then((resp) => {
          if (resp.ok && resp.body?.ok) {
            // หากปลายทางส่ง balance มากับ body ใช้ค่านั้น, ไม่งั้นบวกแบบคาดการณ์
            balance = typeof resp.body?.balance === "number" ? resp.body.balance : balance + amount;
            summary.perWalletBalance[wallet] = balance;
            summary.totalEarned += amount;
          }
          samples.push({ wallet, shot: i, resp });
        });

        batch.push(task);

        // ถึง concurrency → รอ batch นี้เสร็จทั้งหมดก่อนคิวต่อไป
        if (batch.length >= concurrency) {
          await Promise.allSettled(batch);
          batch.length = 0;

          // หลังจบ batch เช็ค cap อีกครั้ง
          if (stopAtCap && balance >= DAILY_CAP) break;
        }
      }

      // รอ batch สุดท้ายของ wallet นี้
      if (batch.length) {
        await Promise.allSettled(batch);
      }
    }

    return NextResponse.json({ ok: true, summary, samples });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error("[turbo-earn] error:", err);
    const msg =
      err?.message || (Array.isArray(err?.issues) ? JSON.stringify(err.issues) : "Invalid input");
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
