import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const today = () => new Date(new Date().setHours(0, 0, 0, 0));
const tomorrow = () => new Date(new Date().setHours(24, 0, 0, 0));

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const restaurantId = session.user.restaurantId;

  const [
    tableCount,
    menuItemCount,
    newOrders,
    preparingOrders,
    readyOrders,
    todayRevenueAgg,
    recentOrders,
    totalOrdersToday,
    servedPaidToday,
    unpaidOrders,
    restaurant,
    pendingReservations,
    todayReservations,
    activeWaiterRequests,
  ] = await Promise.all([
    prisma.table.count({ where: { restaurantId, isActive: true } }),
    prisma.menuItem.count({ where: { restaurantId, isAvailable: true } }),
    prisma.order.count({ where: { restaurantId, status: "NEW" } }),
    prisma.order.count({ where: { restaurantId, status: "PREPARING" } }),
    prisma.order.count({ where: { restaurantId, status: "READY" } }),
    prisma.order.aggregate({
      where: {
        restaurantId,
        status: { in: ["PAID", "SERVED"] },
        createdAt: { gte: today() },
      },
      _sum: { total: true },
    }),
    prisma.order.findMany({
      where: { restaurantId, status: { in: ["NEW", "PREPARING", "READY"] } },
      include: {
        table: { select: { tableNumber: true } },
        orderItems: { select: { nameSnapshot: true, quantity: true } },
        branch: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.order.count({ where: { restaurantId, createdAt: { gte: today() } } }),
    prisma.order.count({
      where: { restaurantId, status: { in: ["SERVED", "PAID"] }, createdAt: { gte: today() } },
    }),
    prisma.order.count({
      where: { restaurantId, paymentStatus: "UNPAID", status: { notIn: ["CANCELLED"] } },
    }),
    prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { name: true, currency: true },
    }),
    // Pending reservations (not yet confirmed or completed)
    prisma.reservation.count({
      where: { restaurantId, status: "PENDING" },
    }),
    // Today's confirmed reservations
    prisma.reservation.count({
      where: {
        restaurantId,
        status: "CONFIRMED",
        reservationDate: { gte: today(), lt: tomorrow() },
      },
    }),
    // Active waiter requests (PENDING = not yet handled)
    prisma.waiterRequest.count({
      where: { restaurantId, status: "PENDING" },
    }),
  ]);

  return NextResponse.json({
    tableCount,
    menuItemCount,
    newOrders,
    preparingOrders,
    readyOrders,
    todayRevenue: todayRevenueAgg._sum.total?.toNumber() ?? 0,
    totalOrdersToday,
    servedPaidToday,
    unpaidOrders,
    restaurant,
    pendingReservations,
    todayReservations,
    activeWaiterRequests,
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      total: o.total.toNumber(),
      createdAt: o.createdAt.toISOString(),
      orderType: o.orderType,
      customerName: o.customerName,
      table: o.table,
      branch: o.branch,
      orderItems: o.orderItems,
    })),
  });
}
