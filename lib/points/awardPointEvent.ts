import { prisma } from "@/lib/prisma";

type Source = "node-agent" | "verifier" | "worker" | "admin" | "legacy";

/**
 * awardPointEvent
 * - สร้าง ledger event แบบ idempotent ด้วย dedupeKey (unique)
 * - update PointBalance แบบ atomic
 */
export async function awardPointEvent(input: {
  userId: string;
  nodeId?: string;

  type: string;
  amount: number;

  source: Source;
  ruleVersion: string;
  dedupeKey: string;

  meta?: any;
  signatureOk?: boolean;
  riskScore?: number;
  occurredAt: Date;
}) {
  try {
    return await prisma.$transaction(async (tx) => {
      const event = await tx.pointEvent.create({
        data: {
          // ✅ ใช้ relation connect แทน userId scalar (แก้ type error)
          user: { connect: { id: input.userId } },

          ...(input.nodeId
            ? { node: { connect: { id: input.nodeId } } }
            : {}),

          type: input.type,
          amount: input.amount,
          source: input.source,
          ruleVersion: input.ruleVersion,
          dedupeKey: input.dedupeKey,
          meta: input.meta,
          signatureOk: input.signatureOk ?? false,
          riskScore: input.riskScore ?? 0,
          occurredAt: input.occurredAt,
        },
      });

      await tx.pointBalance.upsert({
        where: { userId: input.userId },
        update: { balance: { increment: input.amount } },
        create: {
          userId: input.userId,
          balance: input.amount,
        },
      });

      return { ok: true as const, event };
    });
  } catch (e: any) {
    // P2002 = dedupeKey ซ้ำ → ถือว่า idempotent สำเร็จ
    if (e?.code === "P2002") {
      return { ok: true as const, duplicate: true as const };
    }
    throw e;
  }
}
