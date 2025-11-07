"use client";
import { useWallet, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEffect, useState } from "react";
import { signInWithWallet } from "@/lib/auth/siws";
import { parseRefCookie, REF_COOKIE_NAME } from "@/lib/referral";

export default function ConnectWalletButton() {
  const { publicKey, signMessage, connected } = useWallet();
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    (async () => {
      if (!connected || !publicKey || !signMessage) return;
      try {
        // 1) ออก JWT
        await signInWithWallet(publicKey, signMessage);

        // 2) ดึง referral code จาก cookie (ถ้ามี)
        let referralCode: string | undefined = undefined;
        const cookieStr = document.cookie || "";
        const raw = cookieStr.split("; ").find((v) => v.startsWith(`${REF_COOKIE_NAME}=`));
        if (raw) {
          try {
            const val = decodeURIComponent(raw.split("=")[1]);
            const obj = JSON.parse(val);
            if (obj?.code) referralCode = obj.code;
          } catch {}
        }

        // 3) bootstrap user (บันทึก/อัปเดต user + ผูก ref ถ้ามี)
        await fetch("/api/user/bootstrap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ referralCode }),
        });

        setBootstrapped(true);
      } catch (e) {
        console.error("wallet sign-in failed", e);
      }
    })();
  }, [connected, publicKey, signMessage]);

  // ใช้ปุ่ม modal รวมกระเป๋า
  return <WalletMultiButton />;
}
