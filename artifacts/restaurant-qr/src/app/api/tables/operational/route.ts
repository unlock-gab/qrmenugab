import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const restaurantId = session.user.restaurantId;

  const tables = await prisma.table.findMany({
    where: { restaurantId, isActive: true },
    include: {
      orders: {
        where: { status: { in: ["NEW", "PREPARING", "READY", "SERVED"] } },
        select: {
          id: true, orderNumber: true, status: true,
          total: true, paymentStatus: true,
          orderItems: { select: { quantity: true } },
        },
      },
      waiterRequests: {
        where: { status: "PENDING" },
        select: { id: true, type: true, status: true, createdAt: true },
      },
    },
    orderBy: { tableNumber: "asc" },
  });

  return NextResponse.json(
    tables.map((t) => ({
      id: t.id,
      tableNumber: t.tableNumber,
      qrToken: t.qrToken,
      isActive: t.isActive,
      activeOrders: t.orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: o.total.toNumber(),
        paymentStatus: o.paymentStatus,
        itemCount: o.orderItems.reduce((s, i) => s + i.quantity, 0),
      })),
      pendingRequests: t.waiterRequests.map((r) => ({
        id: r.id,
        type: r.type,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      })),
    }))
  );
}
