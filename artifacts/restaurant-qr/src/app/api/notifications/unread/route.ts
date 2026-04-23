import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) {
    return NextResponse.json({ count: 0 });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [orderCount, reservationCount, waiterCount] = await Promise.all([
    prisma.order.count({
      where: {
        restaurantId: session.user.restaurantId,
        status: "NEW",
        createdAt: { gte: since },
      },
    }),
    prisma.reservation.count({
      where: {
        restaurantId: session.user.restaurantId,
        status: "PENDING",
        createdAt: { gte: since },
      },
    }).catch(() => 0),
    prisma.waiterRequest.count({
      where: {
        restaurantId: session.user.restaurantId,
        status: "PENDING",
        createdAt: { gte: since },
      },
    }).catch(() => 0),
  ]);

  const recent = await prisma.notificationLog.findMany({
    where: {
      restaurantId: session.user.restaurantId,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: {
      id: true,
      eventType: true,
      body: true,
      status: true,
      channel: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    count: orderCount + reservationCount + waiterCount,
    orders: orderCount,
    reservations: reservationCount,
    waiterRequests: waiterCount,
    recent: recent.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
    })),
  });
}
