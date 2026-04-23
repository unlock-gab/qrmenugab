import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export type UserRole =
  | "PLATFORM_ADMIN"
  | "MERCHANT_OWNER"
  | "MERCHANT_STAFF"
  | "STAFF_KITCHEN"
  | "STAFF_WAITER"
  | "STAFF_CASHIER";

export const MERCHANT_ROLES: UserRole[] = [
  "MERCHANT_OWNER",
  "MERCHANT_STAFF",
  "STAFF_KITCHEN",
  "STAFF_WAITER",
  "STAFF_CASHIER",
];

export async function getCurrentSession() {
  return getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getCurrentSession();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  return session;
}

export async function requirePlatformAdmin(req?: unknown) {
  const session = await requireAuth();
  if (session.user.role !== "PLATFORM_ADMIN") throw new Error("FORBIDDEN");
  return session;
}

export async function requireMerchant() {
  const session = await requireAuth();
  if (!MERCHANT_ROLES.includes(session.user.role as UserRole)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export async function requireMerchantOwner() {
  const session = await requireAuth();
  if (session.user.role !== "MERCHANT_OWNER") throw new Error("FORBIDDEN");
  return session;
}

export async function requireKitchenAccess() {
  const session = await requireAuth();
  const allowed: UserRole[] = ["MERCHANT_OWNER", "MERCHANT_STAFF", "STAFF_KITCHEN"];
  if (!allowed.includes(session.user.role as UserRole)) throw new Error("FORBIDDEN");
  return session;
}

export async function requireWaiterAccess() {
  const session = await requireAuth();
  const allowed: UserRole[] = ["MERCHANT_OWNER", "MERCHANT_STAFF", "STAFF_WAITER"];
  if (!allowed.includes(session.user.role as UserRole)) throw new Error("FORBIDDEN");
  return session;
}

export async function requireCashierAccess() {
  const session = await requireAuth();
  const allowed: UserRole[] = ["MERCHANT_OWNER", "MERCHANT_STAFF", "STAFF_CASHIER"];
  if (!allowed.includes(session.user.role as UserRole)) throw new Error("FORBIDDEN");
  return session;
}

export function isPlatformAdmin(role?: string | null) {
  return role === "PLATFORM_ADMIN";
}

export function isMerchant(role?: string | null) {
  return MERCHANT_ROLES.includes(role as UserRole);
}

export function isMerchantOwner(role?: string | null) {
  return role === "MERCHANT_OWNER";
}

export function isKitchenStaff(role?: string | null) {
  return role === "STAFF_KITCHEN";
}

export function isWaiterStaff(role?: string | null) {
  return role === "STAFF_WAITER";
}

export function isCashierStaff(role?: string | null) {
  return role === "STAFF_CASHIER";
}

export function getDefaultRouteForRole(role?: string | null): string {
  switch (role) {
    case "PLATFORM_ADMIN": return "/admin/dashboard";
    case "STAFF_KITCHEN": return "/kitchen";
    case "STAFF_WAITER": return "/waiter";
    case "STAFF_CASHIER": return "/cashier";
    default: return "/dashboard";
  }
}
