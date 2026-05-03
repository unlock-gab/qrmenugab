import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { TableDetailClient } from "@/components/dashboard/TableDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TableDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) notFound();

  const restaurantId = session.user.restaurantId;

  const table = await prisma.table.findFirst({
    where: { id, restaurantId },
  });
  if (!table) notFound();

  const [orders, waiterRequests, restaurant] = await Promise.all([
    prisma.order.findMany({
      where: { tableId: id, status: { in: ["NEW", "PREPARING", "READY", "SERVED"] } },
      include: {
        orderItems: {
          select: {
            id: true, nameSnapshot: true, quantity: true, unitPrice: true,
            selectedOptions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.waiterRequest.findMany({
      where: { tableId: id, restaurantId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { slug: true, currency: true },
    }),
  ]);

  const serializedOrders = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    paymentStatus: o.paymentStatus,
    total: o.total.toNumber(),
    notes: o.notes,
    createdAt: o.createdAt.toISOString(),
    orderItems: o.orderItems.map((i) => ({
      id: i.id,
      nameSnapshot: i.nameSnapshot,
      quantity: i.quantity,
      unitPrice: i.unitPrice.toNumber(),
    })),
  }));

  const serializedRequests = waiterRequests.map((r) => ({
    id: r.id,
    type: r.type as "CALL_WAITER" | "REQUEST_BILL" | "HELP",
    status: r.status as "PENDING" | "HANDLED",
    notes: r.notes,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <TableDetailClient
      table={{ id: table.id, tableNumber: table.tableNumber, qrToken: table.qrToken }}
      orders={serializedOrders}
      waiterRequests={serializedRequests}
      restaurantSlug={restaurant?.slug || ""}
    />
  );
}
