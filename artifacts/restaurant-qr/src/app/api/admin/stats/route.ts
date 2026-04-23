import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/permissions";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    await requirePlatformAdmin();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalRestaurants,
      activeRestaurants,
      pendingRestaurants,
      suspendedRestaurants,
      inactiveRestaurants,
      totalUsers,
      merchantUsers,
      todayOrders,
      totalMenuItems,
      totalTables,
      recentRestaurants,
    ] = await Promise.all([
      prisma.restaurant.count(),
      prisma.restaurant.count({ where: { status: "ACTIVE" } }),
      prisma.restaurant.count({ where: { status: "PENDING_SETUP" } }),
      prisma.restaurant.count({ where: { status: "SUSPENDED" } }),
      prisma.restaurant.count({ where: { status: "INACTIVE" } }),
      prisma.user.count(),
      prisma.user.count({ where: { role: { in: ["MERCHANT_OWNER", "MERCHANT_STAFF"] } } }),
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.menuItem.count(),
      prisma.table.count({ where: { isActive: true } }),
      prisma.restaurant.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          createdAt: true,
          subscription: { select: { status: true, plan: { select: { name: true } } } },
        },
      }),
    ]);

    return NextResponse.json({
      restaurants: {
        total: totalRestaurants,
        active: activeRestaurants,
        pending: pendingRestaurants,
        suspended: suspendedRestaurants,
        inactive: inactiveRestaurants,
      },
      users: { total: totalUsers, merchants: merchantUsers },
      todayOrders,
      totalMenuItems,
      totalTables,
      recentRestaurants,
    });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
