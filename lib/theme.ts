// lib/theme.ts
"use client";

export type Theme = "dark" | "oled" | "system";

let media: MediaQueryList | null = null;
let listener: ((e: MediaQueryListEvent) => void) | null = null;

function prefersDark(): boolean {
  try {
    return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  } catch {
    // ค่าปลอดภัยสำหรับเว็บของเรา (default เป็น dark อยู่แล้ว)
    return true;
  }
}

function setClasses(dark: boolean, oled: boolean) {
  const root = document.documentElement;
  root.classList.toggle("dark", !!dark);
  if (oled) root.classList.add("theme-oled");
  else root.classList.remove("theme-oled");
}

/** ใช้เมื่อต้องการสลับธีมทันทีในฝั่ง client */
export function applyTheme(theme: Theme) {
  if (theme === "system") {
    // ให้ตามระบบ และฟังการเปลี่ยนแปลงของระบบ
    setClasses(prefersDark(), false);

    if (!media && typeof window !== "undefined" && window.matchMedia) {
      media = window.matchMedia("(prefers-color-scheme: dark)");
    }
    if (media && !listener) {
      listener = (e) => setClasses(e.matches, false);
      try {
        media.addEventListener("change", listener);
      } catch {
        // Safari เก่า
        (media as any).addListener(listener);
      }
    }
  } else {
    // โหมดกำหนดเอง: ตัด listener ออก แล้วบังคับ class
    if (media && listener) {
      try {
        media.removeEventListener("change", listener);
      } catch {
        (media as any).removeListener(listener);
      }
      listener = null;
    }
    // ธีมของเรามีแค่ dark & oled (เป็น dark ทั้งคู่ แต่ oled จะใช้พื้นหลังดำสนิท)
    setClasses(true, theme === "oled");
  }
}

/** เรียกเมื่อต้องการยกเลิกการติดตาม system theme (เช่น unmount หน้า settings) */
export function detachSystemThemeListener() {
  if (media && listener) {
    try {
      media.removeEventListener("change", listener);
    } catch {
      (media as any).removeListener(listener);
    }
    listener = null;
  }
}
