import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function getAuthedUserFromCookies() {
  const cookieStore = cookies();

  const auth = cookieStore.get("solink_auth")?.value;
  if (!auth) return { ok: false as const, reason: "Not authenticated" };

  const wallet = cookieStore.get("solink_wallet")?.value;
  if (!wallet) return { ok: false as const, reason: "No wallet cookie" };

  const user = await prisma.user.findFirst({
    where: { wallet },
    select: { id: true, wallet: true },
  });

  if (!user) return { ok: false as const, reason: "User not found" };

  return { ok: true as const, user };
}
