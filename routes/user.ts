// routes/user.ts
import { Router } from "express";
import { prisma } from "../lib/prisma"; // path ตามโปรเจ็กต์คุณ
import { authOptional } from "../middleware/auth"; // อ่าน JWT → req.user

const router = Router();

/**
 * POST /api/user/bootstrap
 * body: { referralCode?: string }
 * - ใช้ JWT จาก cookie เพิ่อทราบ userId/wallet
 * - upsert user (wallet, referral linkage) ถ้ายังไม่มี
 */
router.post("/user/bootstrap", authOptional, async (req, res) => {
  const u = (req as any).user;
  if (!u || typeof u.sub !== "string") {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }
  const userId = u.sub;
  const wallet = u.wallet || userId;

  const { referralCode } = req.body || {};

  // หา referrer จาก referralCode (ตามกติกาที่คุณกำหนด – เช่น code=address.slice(2,10))
  let referrerId: string | null = null;
  if (typeof referralCode === "string" && referralCode.trim()) {
    const cand = await prisma.user.findFirst({
      where: {
        // ตัวอย่าง: ref-code เก็บเทียบในตารางอื่น หรือ derive จาก address
        // ที่นี่สมมติว่ารหัส = address.slice(2,10)
        // เลยต้องหาทุก user แล้ว map (แนะนำจริง ๆ ให้มี field refCode)
      },
      select: { id: true, wallet: true },
    });
    // แนะนำ: สร้าง field user.refCode แล้วหาโดยตรงจะง่ายกว่า
  }

  // upsert user
  await prisma.user.upsert({
    where: { id: userId },
    update: referrerId ? { wallet, referrerId } : { wallet },
    create: { id: userId, wallet, referrerId: referrerId || undefined },
  });

  return res.json({ ok: true });
});

export default router;
