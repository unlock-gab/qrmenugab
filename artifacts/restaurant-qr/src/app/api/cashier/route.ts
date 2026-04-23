import { NextResponse } from "next/server";
import { requireCashierAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await requireCashierAccess();
    const restaurantId = session.user.restaurantId;
    if (!restaurantId) return NextResponse.json({ error: "No restaurant" }, { status: 400 });

    const orders = await prisma.order.findMany({
      where: {
        restaurantId,
        paymentStatus: "UNPAID",
        status: { notIn: ["CANCELLED"] },
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

    return NextResponse.json(orders);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
