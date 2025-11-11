// lib/tz.ts
export const SOLINK_TZ =
  process.env.NEXT_PUBLIC_SOLINK_TIMEZONE ||
  process.env.SOLINK_TIMEZONE ||
  "UTC";
