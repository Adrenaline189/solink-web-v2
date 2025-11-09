// app/api/dev/turbo-earn/route.ts
import { NextRequest, NextResponse } from "next/server";

const API = process.env.SOLINK_API_URL || "https://api-solink.network";
const DAILY_CAP = Number(process.env.POINTS_DAILY_CAP || 2000);

type EarnType = "extension_farm" | "referral_bonus";

async function demoLogin(wallet: string) {
  const r = await fetch(`${API}/api/auth/demo-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet }),
    cache: "no-store",
  });
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`demo-login failed for ${wallet}: ${r.status} ${txt}`);
  }
  const j = await r.json();
  return j.token as string;
}

async function getCurrentBalance(token: string) {
  // NOTE: adjust upstream path here if your API uses different summary endpoint
  const r = await fetch(`${API}/api/users/me/summary`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!r.ok) return null;
  try {
    return await r.json();
  } catch {
    return null;
  }
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function fireEarn(token: string, type: EarnType, amount: number, meta: any) {
  const payload = {
    type,
    amount,
    meta: {
      ...meta,
      session: meta?.session ?? `dash-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
      nonce: `dash-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    },
  };
  const r = await fetch(`${API}/api/points/earn`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const text = await r.text();
  let body: any = {};
  try { body = JSON.parse(text); } catch { body = { raw: text }; }
  return { ok: r.ok && body?.ok, status: r.status, body, payload };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      wallets = ["demo_wallet"],
      type = "extension_farm",
      amount = 50,
      bursts = 40,
      concurrency = 5,
      minDelayMs = 150,
      jitterMs = 100,
      stopAtCap = true,
      meta: baseMeta = {},
    } = body || {};

    if (!Array.isArray(wallets) || wallets.length === 0) {
      return NextResponse.json({ ok: false, error: "wallets[] required" }, { status: 400 });
    }

    // login all wallets (parallel)
    const tokens: string[] = await Promise.all(
      wallets.map(async (w: string) => {
        const t = await demoLogin(w);
        return t;
      })
    );

    const results: any[] = [];
    const perWalletBalance: Record<string, number> = {};

    // helper per-wallet runner with internal concurrency
    async function runForWallet(wallet: string, token: string) {
      perWalletBalance[wallet] = 0;

      // check current balance (upstream)
      const summary = await getCurrentBalance(token);
      const currentBalance = summary?.balance ?? 0;
      perWalletBalance[wallet] = Number(currentBalance);

      // if stopAtCap and already at/over cap -> skip
      if (stopAtCap && perWalletBalance[wallet] >= DAILY_CAP) {
        results.push({ wallet, skipped: true, reason: "already_at_cap", currentBalance });
        return;
      }

      // prepare queue (bursts)
      const queue = Array.from({ length: bursts }, (_, i) => i);
      let active = 0;
      let idx = 0;

      return new Promise<void>((resolve) => {
        const tick = async () => {
          if (idx >= queue.length) {
            if (active === 0) resolve();
            return;
          }
          while (active < concurrency && idx < queue.length) {
            const n = queue[idx++];
            active++;
            (async () => {
              try {
                // stop if reached cap
                if (stopAtCap && perWalletBalance[wallet] >= DAILY_CAP) {
                  results.push({ wallet, stoppedAtCap: true, currentBalance: perWalletBalance[wallet] });
                  active--; tick();
                  return;
                }

                // build meta for this shot
                const meta = { ...baseMeta };
                if (type === "referral_bonus" && !meta.referredUserId) {
                  meta.referredUserId = `user_${wallets[0] || "ref"}`;
                }

                const resp = await fireEarn(token, type as EarnType, amount, meta);
                results.push({ wallet, shot: n, resp });

                if (resp.ok && resp.body?.event?.amount) {
                  perWalletBalance[wallet] += Number(resp.body.event.amount) || 0;
                } else if (resp.body?.deduped) {
                  // deduped: no increase
                }

                // small delay with jitter
                const delay = minDelayMs + Math.floor(Math.random() * jitterMs);
                await sleep(delay);
              } catch (err: any) {
                results.push({ wallet, error: String(err?.message || err) });
              } finally {
                active--; tick();
              }
            })();
          }
        };
        tick();
      });
    }

    // run all wallets in parallel (each manages its own internal concurrency)
    await Promise.all(wallets.map((w: string, i: number) => runForWallet(w, tokens[i])));

    const total = Object.values(perWalletBalance).reduce((a, b) => a + Number(b || 0), 0);

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
        dailyCap: DAILY_CAP,
      },
      // include last 20 samples for quick inspection
      samples: results.slice(-20),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "unexpected error" }, { status: 500 });
  }
}
