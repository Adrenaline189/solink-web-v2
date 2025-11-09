// app/api/dev/turbo-earn/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  wallets: z.array(z.string()).min(1),
  type: z.enum(["extension_farm", "referral_bonus"]),
  amount: z.number().min(1),
  bursts: z.number().min(1).max(200),
  concurrency: z.number().min(1).max(10),
  minDelayMs: z.number().default(300),
  jitterMs: z.number().default(200),
  stopAtCap: z.boolean().default(false),
});

// 🔧 API endpoint ที่ยิงไปยัง Solink API จริง
const API_BASE = process.env.SOLINK_API_URL || "https://api-solink.network";
const DEV_SECRET = process.env.DEV_SECRET || "demo_secret_key";

// Helper: หน่วงเวลา
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 🔁 ระบบ retry/backoff เมื่อเจอ rate-limit (429)
const MAX_RETRIES = 5;
const BASE_BACKOFF = 300; // ms
async function fireEarnWithRetry(
  token: string,
  type: string,
  amount: number,
  meta: Record<string, any>
) {
  let attempt = 0;
  while (true) {
    const resp = await fireEarn(token, type, amount, meta);

    // สำเร็จหรือไม่ควร retry → คืนเลย
    if (resp.ok || resp.status !== 429 || attempt >= MAX_RETRIES) return resp;

    // 429 → backoff แบบ exponential + jitter
    const wait = BASE_BACKOFF * Math.pow(2, attempt) + Math.floor(Math.random() * 300);
    console.warn(`[Backoff] 429 detected, retry #${attempt + 1} after ${wait}ms`);
    await sleep(wait);
    attempt++;
  }
}

// ยิง event จริงไปที่ API
async function fireEarn(
  token: string,
  type: string,
  amount: number,
  meta: Record<string, any>
) {
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
  } catch (err: any) {
    return { ok: false, status: 500, body: { error: err?.message || "Network error" } };
  }
}

// ขอ token สำหรับแต่ละ wallet
async function loginWallet(wallet: string) {
  const r = await fetch(`${API_BASE}/api/auth/demo-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet }),
  });
  const data = await r.json();
  return data?.token || null;
}

/* ===================================================================== */
export async function POST(req: Request) {
  try {
    const json = await req.json();
    const input = schema.parse(json);

    const { wallets, type, amount, bursts, concurrency, minDelayMs, jitterMs, stopAtCap } = input;

    // login wallets
    const tokens: Record<string, string> = {};
    for (const w of wallets) {
      const t = await loginWallet(w);
      if (!t) throw new Error(`Cannot login wallet ${w}`);
      tokens[w] = t;
    }

    // main queue
    const summary: any = {
      wallets,
      type,
      amountPerShot: amount,
      bursts,
      concurrency,
      perWalletBalance: {},
      totalEarned: 0,
      dailyCap: 2000,
    };

    const samples: any[] = [];
    const queue: Promise<void>[] = [];

    for (const wallet of wallets) {
      const token = tokens[wallet];
      let balance = 0;
      for (let i = 0; i < bursts; i++) {
        // random delay
        const delay = minDelayMs + Math.floor(Math.random() * jitterMs);
        await sleep(delay);

        const meta = {
          session: `dash-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          nonce: `dash-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        };

        const p = fireEarnWithRetry(token, type, amount, meta).then((resp) => {
          if (resp.ok && resp.body?.ok) {
            balance = resp.body.balance ?? balance + amount;
            summary.perWalletBalance[wallet] = balance;
            summary.totalEarned += amount;
          }
          samples.push({ wallet, shot: i, resp });
        });

        queue.push(p);

        // ควบคุม concurrency
        if (queue.length >= concurrency) {
          await Promise.race(queue);
          for (let j = queue.length - 1; j >= 0; j--) {
            if (queue[j].resolved) queue.splice(j, 1);
          }
        }

        // หยุดถ้าถึง daily cap
        if (stopAtCap && balance >= summary.dailyCap) break;
      }
    }

    await Promise.all(queue);

    return NextResponse.json({ ok: true, summary, samples });
  } catch (err: any) {
    console.error("turbo-earn error", err);
    return NextResponse.json({ ok: false, error: err.message || "Invalid input" }, { status: 400 });
  }
}
