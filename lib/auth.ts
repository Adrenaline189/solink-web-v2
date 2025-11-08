// lib/auth.ts
import { NextRequest } from "next/server";

export function requireApiKey(req: NextRequest) {
  const header = req.headers.get("x-api-key") || req.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : header;
  if (!process.env.API_KEY) throw new Error("API_KEY is not configured");
  if (token !== process.env.API_KEY) {
    const e = new Error("Unauthorized");
    // @ts-ignore
    e.status = 401;
    throw e;
  }
}
