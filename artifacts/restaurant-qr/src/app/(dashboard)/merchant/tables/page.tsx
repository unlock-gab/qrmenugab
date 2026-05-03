import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { OperationalTablesClient } from "@/components/dashboard/OperationalTablesClient";
import Link from "next/link";

export default async function TablesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) notFound();

  const restaurantId = session.user.restaurantId;

  const [restaurant, tables] = await Promise.all([
    prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { slug: true, name: true },
    }),
    prisma.table.findMany({
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
    }),
  ]);

  if (!restaurant) notFound();

  const serialized = tables.map((t) => ({
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
      type: r.type as "CALL_WAITER" | "REQUEST_BILL" | "HELP",
      status: r.status as "PENDING" | "HANDLED",
      createdAt: r.createdAt.toISOString(),
    })),
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Tables</h1>
          <p className="text-gray-400 text-sm mt-0.5">Vue opérationnelle en temps réel</p>
        </div>
        <Link
          href="/merchant/qr-center"
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition"
        >
          📲 Gérer les QR codes
        </Link>
      </div>

      <OperationalTablesClient
        initialTables={serialized}
        restaurantSlug={restaurant.slug}
      />
    </div>
  );
}
