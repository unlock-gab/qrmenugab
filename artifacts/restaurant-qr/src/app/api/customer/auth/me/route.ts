import { NextResponse } from "next/server";
import { getCustomerFromCookies } from "@/lib/customerAuth";
import prisma from "@/lib/prisma";

export async function GET() {
  const payload = await getCustomerFromCookies();
  if (!payload) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const customer = await prisma.customer.findUnique({
    where: { id: payload.id },
    select: { id: true, name: true, email: true, phone: true, createdAt: true },
  });
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  return NextResponse.json(customer);
}
