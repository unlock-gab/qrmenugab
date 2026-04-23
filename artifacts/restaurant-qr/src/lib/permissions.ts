import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export type UserRole = "PLATFORM_ADMIN" | "MERCHANT_OWNER" | "MERCHANT_STAFF";

export async function getCurrentSession() {
  return getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getCurrentSession();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  return session;
}

export async function requirePlatformAdmin() {
  const session = await requireAuth();
  if (session.user.role !== "PLATFORM_ADMIN") throw new Error("FORBIDDEN");
  return session;
}

export async function requireMerchant() {
  const session = await requireAuth();
  if (!["MERCHANT_OWNER", "MERCHANT_STAFF"].includes(session.user.role ?? "")) {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export async function requireMerchantOwner() {
  const session = await requireAuth();
  if (session.user.role !== "MERCHANT_OWNER") throw new Error("FORBIDDEN");
  return session;
}

export function isPlatformAdmin(role?: string | null) {
  return role === "PLATFORM_ADMIN";
}

export function isMerchant(role?: string | null) {
  return role === "MERCHANT_OWNER" || role === "MERCHANT_STAFF";
}

export function isMerchantOwner(role?: string | null) {
  return role === "MERCHANT_OWNER";
}
