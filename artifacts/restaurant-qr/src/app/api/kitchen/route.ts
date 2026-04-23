import { NextRequest, NextResponse } from "next/server";
import { requireKitchenAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await requireKitchenAccess();
    const restaurantId = session.user.restaurantId;
    if (!restaurantId) return NextResponse.json({ error: "No restaurant" }, { status: 400 });

    const branchId = new URL(req.url).searchParams.get("branchId") || undefined;

    const orders = await prisma.order.findMany({
      where: {
        restaurantId,
        status: { in: ["NEW", "PREPARING", "READY"] },
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

    return NextResponse.json(orders);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
