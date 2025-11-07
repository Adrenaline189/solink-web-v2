"use client";

import { useEffect, useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { signInWithWallet } from "@/lib/auth/siws";
import { REF_COOKIE_NAME } from "@/lib/referral";

/**
 * ปุ่ม Connect Wallet ของจริง (Phantom / Solflare / Backpack ฯลฯ)
 * - เมื่อ connect สำเร็จ จะ sign message
 * - ส่งข้อมูลไป verify -> ได้ JWT (AUTH cookie)
 * - จากนั้นยิง /api/user/bootstrap เพื่อสร้าง/อัปเดต user
 */
export default function ConnectWalletButton() {
  const { publicKey, signMessage, connected } = useWallet();
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    (async () => {
      if (!connected || !publicKey || !signMessage || bootstrapped) return;

      try {
        // 1️⃣ เซ็นข้อความเพื่อสร้าง JWT
        await signInWithWallet(publicKey, signMessage);

        // 2️⃣ อ่าน referral code จาก cookie (ถ้ามี)
        let referralCode: string | undefined;
        const cookieStr = document.cookie || "";
        const ref = cookieStr.split("; ").find((v) => v.startsWith(`${REF_COOKIE_NAME}=`));
        if (ref) {
          try {
            const val = decodeURIComponent(ref.split("=")[1]);
            const obj = JSON.parse(val);
            if (obj?.code) referralCode = obj.code;
          } catch {}
        }

        // 3️⃣ ยิง /api/user/bootstrap เพื่อบันทึกผู้ใช้
        await fetch("/api/user/bootstrap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ referralCode }),
        });

        setBootstrapped(true);
        console.log("[Solink] Wallet connected and user bootstrapped.");
      } catch (err) {
        console.error("[Solink] Wallet connect/sign failed", err);
      }
    })();
  }, [connected, publicKey, signMessage, bootstrapped]);

  // ✅ ใช้ WalletMultiButton (modal รวมกระเป๋า)
  return <WalletMultiButton />;
}
