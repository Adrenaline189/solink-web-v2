// server/convert-config.ts
"use server";

import { prisma } from "@/lib/prisma";

export type ConvertConfig = {
  enabled: boolean;
};

// ใช้ userId ว่าง "" เป็นตัวแทน global setting (system row)
const SYSTEM_USER_ID = "";

// helper แปลง string → boolean
function parseBool(v: string | null | undefined, defaultValue: boolean): boolean {
  if (!v) return defaultValue;
  const s = v.toLowerCase().trim();
  if (["true", "1", "yes", "on"].includes(s)) return true;
  if (["false", "0", "no", "off"].includes(s)) return false;
  return defaultValue;
}

/**
 * อ่าน config การเปิด/ปิด convert จาก DB
 * ถ้าไม่มีใน DB จะ fallback ไปใช้ ENV: CONVERT_ENABLED (default = true)
 */
export async function getConvertConfig(): Promise<ConvertConfig> {
  // 1) พยายามอ่านจากตาราง Setting (global row)
  try {
    const setting = await prisma.setting.findUnique({
      where: {
        userId_key: {
          userId: SYSTEM_USER_ID,
          key: "convert_enabled",
        },
      },
    });

    if (setting) {
      const enabled = parseBool(setting.value, true);
      return { enabled };
    }
  } catch (e) {
    console.error("[convert-config] failed to read Setting:", e);
  }

  // 2) ถ้าไม่มีใน DB → fallback ไปใช้ ENV
  const envRaw = process.env.CONVERT_ENABLED ?? "true";
  const enabled = parseBool(envRaw, true);
  return { enabled };
}
