import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import prisma from "@/lib/prisma";
import { signCustomerToken, customerCookieOptions } from "@/lib/customerAuth";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  password: z.string().min(6).max(100),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { name, email, phone, password } = parsed.data;

  const existing = await prisma.customer.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

  const passwordHash = await hash(password, 12);
  const customer = await prisma.customer.create({
    data: { name, email, phone: phone || null, passwordHash },
  });

  const token = await signCustomerToken({ id: customer.id, email: customer.email, name: customer.name });
  const res = NextResponse.json({ id: customer.id, name: customer.name, email: customer.email }, { status: 201 });
  res.cookies.set(customerCookieOptions(token));
  return res;
}
