import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { OrdersClient } from "@/components/dashboard/OrdersClient";

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) return null;

  const [orders, restaurant] = await Promise.all([
    prisma.order.findMany({
      where: { restaurantId: session.user.restaurantId },
      include: {
        table: { select: { tableNumber: true } },
        orderItems: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.restaurant.findUnique({
      where: { id: session.user.restaurantId },
      select: { soundEnabled: true },
    }),
  ]);

  const serialized = orders.map((o) => ({
    ...o,
    subtotal: o.subtotal.toNumber(),
    total: o.total.toNumber(),
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    seenAt: o.seenAt?.toISOString() ?? null,
    orderItems: o.orderItems.map((oi) => ({
      ...oi,
      unitPrice: oi.unitPrice.toNumber(),
      totalPrice: oi.totalPrice.toNumber(),
      createdAt: oi.createdAt.toISOString(),
      updatedAt: oi.updatedAt.toISOString(),
    })),
  }));

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <OrdersClient
        initialOrders={serialized}
        soundEnabled={restaurant?.soundEnabled ?? true}
      />
    </div>
  );
}
