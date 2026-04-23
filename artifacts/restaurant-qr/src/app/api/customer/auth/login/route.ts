import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import prisma from "@/lib/prisma";
import { signCustomerToken, customerCookieOptions } from "@/lib/customerAuth";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const customer = await prisma.customer.findUnique({ where: { email: parsed.data.email } });
  if (!customer || !customer.isActive) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const valid = await compare(parsed.data.password, customer.passwordHash);
  if (!valid) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  const token = await signCustomerToken({ id: customer.id, email: customer.email, name: customer.name });
  const res = NextResponse.json({ id: customer.id, name: customer.name, email: customer.email });
  res.cookies.set(customerCookieOptions(token));
  return res;
}
