import { NextResponse } from "next/server";
import { getCustomerFromCookies } from "@/lib/customerAuth";
import prisma from "@/lib/prisma";

export async function GET() {
  const payload = await getCustomerFromCookies();
  if (!payload) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const orders = await prisma.order.findMany({
    where: { customerId: payload.id },
    include: {
      restaurant: { select: { name: true, currency: true } },
      branch: { select: { name: true } },
      orderItems: {
        select: { nameSnapshot: true, quantity: true, unitPrice: true, totalPrice: true },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(orders.map((o) => ({
    ...o,
    subtotal: Number(o.subtotal),
    total: Number(o.total),
    discountAmount: Number(o.discountAmount),
    finalTotal: Number(o.total) - Number(o.discountAmount),
    orderItems: o.orderItems.map((i) => ({
      ...i,
      unitPrice: Number(i.unitPrice),
      totalPrice: Number(i.totalPrice),
    })),
  })));
}
