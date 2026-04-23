import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "customer-secret-fallback-32chars!!"
);
const COOKIE_NAME = "customer_token";
const EXPIRES_IN = 60 * 60 * 24 * 30; // 30 days

export interface CustomerPayload {
  id: string;
  email: string;
  name: string;
}

export async function signCustomerToken(payload: CustomerPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${EXPIRES_IN}s`)
    .sign(SECRET);
}

export async function verifyCustomerToken(token: string): Promise<CustomerPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as CustomerPayload;
  } catch {
    return null;
  }
}

export async function getCustomerFromCookies(): Promise<CustomerPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyCustomerToken(token);
}

export async function getCustomerFromRequest(req: NextRequest): Promise<CustomerPayload | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyCustomerToken(token);
}

export function customerCookieOptions(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: EXPIRES_IN,
    path: "/",
  };
}

export function clearCustomerCookie() {
  return { name: COOKIE_NAME, value: "", maxAge: 0, path: "/" };
}
