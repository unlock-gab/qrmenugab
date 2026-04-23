import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { OrdersClient } from "@/components/dashboard/OrdersClient";

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) return null;

  const orders = await prisma.order.findMany({
    where: { restaurantId: session.user.restaurantId },
    include: {
      table: { select: { tableNumber: true } },
      orderItems: {
        include: { menuItem: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="p-8 max-w-6xl">
      <OrdersClient initialOrders={orders} />
    </div>
  );
}
