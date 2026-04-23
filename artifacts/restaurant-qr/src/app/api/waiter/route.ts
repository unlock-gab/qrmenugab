import { NextResponse } from "next/server";
import { requireWaiterAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await requireWaiterAccess();
    const restaurantId = session.user.restaurantId;
    if (!restaurantId) return NextResponse.json({ error: "No restaurant" }, { status: 400 });

    const tables = await prisma.table.findMany({
      where: { restaurantId, isActive: true },
      include: {
        orders: {
          where: { status: { notIn: ["PAID", "CANCELLED"] } },
          include: {
            orderItems: {
              include: { menuItem: { select: { name: true } } },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { tableNumber: "asc" },
    });

    const tableData = tables.map((t) => ({
      id: t.id,
      tableNumber: t.tableNumber,
      orders: t.orders,
      activeOrderCount: t.orders.length,
      hasReadyOrders: t.orders.some((o) => o.status === "READY"),
      hasNewOrders: t.orders.some((o) => o.status === "NEW"),
      unpaidTotal: t.orders
        .filter((o) => o.paymentStatus === "UNPAID" && o.status !== "CANCELLED")
        .reduce((sum, o) => sum + Number(o.total), 0),
    }));

    return NextResponse.json(tableData);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
