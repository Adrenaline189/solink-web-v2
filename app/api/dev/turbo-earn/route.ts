// app/api/dev/turbo-earn/route.ts
import { NextRequest, NextResponse } from "next/server";

const API = process.env.SOLINK_API_URL || "https://api-solink.network";
const DAILY_CAP = Number(process.env.POINTS_DAILY_CAP || 2000); // ปรับได้ใน .env

type EarnType = "extension_farm" | "referral_bonus";

async function login(wallet: string) {
  const r = await fetch(`${API}/api/auth/demo-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet }),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`login failed ${r.status}`);
  const j = await r.json();
  return j.token as string;
}

function sleep(ms: number) { return new Promise(res => setTimeout(res, ms)); }

async function fireEarn(token: string, type: EarnType, amount: number, meta: any) {
  const payload = {
    type,
    amount,
    meta: {
      ...meta,
      session: meta?.session ?? `dash-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
      nonce: `dash-${Date.now()}-${Math.random().toString(36).slice(2,8)}`
    }
  };
  const r = await fetch(`${API}/api/points/earn`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const txt = await r.text();
  let j: any; try { j = JSON.parse(txt); } catch { j = { raw: txt }; }
  return { ok: r.ok && j?.ok, status: r.status, body: j };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      wallets = ["demo_wallet"],
      type = "extension_farm",
      amount = 50,
      bursts = 40,          // จำนวนครั้งต่อกระเป๋า
      concurrency = 5,      // ยิงพร้อมกันสูงสุด
      minDelayMs = 150,     // หน่วงระหว่างช็อตต่อคิว
      jitterMs = 100,       // สุ่มเพิ่ม-ลด
      stopAtCap = true,
      meta: baseMeta = {}
    } = body || {};

    if (!Array.isArray(wallets) || wallets.length === 0)
      return NextResponse.json({ ok: false, error: "wallets[] required" }, { status: 400 });

    // login ทุกกระเป๋า
    const tokens = await Promise.all(wallets.map(w => login(w)));
    const results: any[] = [];
    const perWalletBalance: Record<string, number> = {};

    // helper: ทำ queue ต่อ wallet
    async function runForWallet(wallet: string, token: string) {
      let done = 0;
      perWalletBalance[wallet] = 0;
      // จำกัด concurrency ด้วย worker pool
      const queue = Array.from({ length: bursts }, (_, i) => i);
      let active = 0;
      let idx = 0;

      return new Promise<void>((resolve) => {
        const tick = async () => {
          if (idx >= queue.length) { if (active === 0) resolve(); return; }
          while (active < concurrency && idx < queue.length) {
            const n = queue[idx++]; active++;
            (async () => {
              if (stopAtCap && perWalletBalance[wallet] >= DAILY_CAP) { active--; tick(); return; }
              // meta per-shot
              const meta = { ...baseMeta };
              if (type === "referral_bonus" && !meta.referredUserId) {
                meta.referredUserId = `user_${wallets[0]}`; // default
              }
              const resp = await fireEarn(token, type as EarnType, amount, meta);
              results.push({ wallet, n, resp });
              if (resp.ok && resp.body?.event?.amount) {
                perWalletBalance[wallet] += Number(resp.body.event.amount) || 0;
              }
              done++;
              // หน่วง
              const delay = minDelayMs + Math.floor(Math.random() * jitterMs);
              await sleep(delay);
              active--; tick();
            })();
          }
        };
        tick();
      });
    }

    // รันทุก wallet แบบขนาน (คุม concurrency ภายในแต่ละ wallet)
    await Promise.all(wallets.map((w, i) => runForWallet(w, tokens[i])));

    const total = Object.values(perWalletBalance).reduce((a, b) => a + b, 0);

    return NextResponse.json({
      ok: true,
      summary: {
        wallets,
        type,
        amountPerShot: amount,
        bursts,
        concurrency,
        perWalletBalance,
        totalEarned: total,
      },
      samples: results.slice(-10), // แนบตัวอย่างท้าย ๆ 10 รายการ
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "unexpected error" }, { status: 500 });
  }
}
