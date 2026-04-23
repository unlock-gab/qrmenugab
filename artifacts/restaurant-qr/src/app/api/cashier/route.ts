import { NextRequest, NextResponse } from "next/server";
import { requireCashierAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await requireCashierAccess();
    const restaurantId = session.user.restaurantId;
    if (!restaurantId) return NextResponse.json({ error: "No restaurant" }, { status: 400 });

    const branchId = new URL(req.url).searchParams.get("branchId") || undefined;

    const orders = await prisma.order.findMany({
      where: {
        restaurantId,
        paymentStatus: "UNPAID",
        status: { notIn: ["CANCELLED"] },
        ...(branchId ? { branchId } : {}),
      },
      include: {
        table: { select: { tableNumber: true } },
        orderItems: {
          include: { menuItem: { select: { name: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(orders.map((o) => ({
      ...o,
      total: Number(o.total),
      subtotal: Number(o.subtotal),
      discountAmount: Number(o.discountAmount),
      orderItems: o.orderItems.map((i) => ({
        ...i,
        unitPrice: Number((i as { unitPrice: unknown }).unitPrice ?? 0),
        totalPrice: Number((i as { totalPrice: unknown }).totalPrice ?? 0),
      })),
    })));
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
