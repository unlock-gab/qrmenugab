import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "today";
  const branchId = searchParams.get("branchId") || null;

  const now = new Date();
  let startDate: Date;

  switch (period) {
    case "week":
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "today":
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  const restaurantId = session.user.restaurantId;
  const orderWhere = {
    restaurantId,
    createdAt: { gte: startDate },
    status: { not: "CANCELLED" as const },
    ...(branchId ? { branchId } : {}),
  };

  const [orders, topItems, tableUsage, promoUsage, waiterRequestsCount, reservationsCount, branches, ordersByBranch, ordersByType, newCustomers] = await Promise.all([
    prisma.order.findMany({
      where: orderWhere,
      select: {
        id: true, total: true, discountAmount: true,
        paymentStatus: true, status: true, createdAt: true, discountCode: true,
      },
    }),
    prisma.orderItem.groupBy({
      by: ["menuItemId", "nameSnapshot"],
      where: { order: orderWhere },
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    }),
    prisma.order.groupBy({
      by: ["tableId"],
      where: { ...orderWhere, tableId: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
    prisma.promoCode.findMany({
      where: { restaurantId, usedCount: { gt: 0 } },
      select: { code: true, usedCount: true, discountType: true, discountValue: true },
      orderBy: { usedCount: "desc" },
      take: 10,
    }),
    prisma.waiterRequest.count({
      where: { restaurantId, createdAt: { gte: startDate }, ...(branchId ? { branchId } : {}) },
    }),
    prisma.reservation.count({
      where: { restaurantId, createdAt: { gte: startDate }, ...(branchId ? { branchId } : {}) },
    }),
    prisma.branch.findMany({
      where: { restaurantId, status: "ACTIVE" },
      select: { id: true, name: true },
    }),
    prisma.order.groupBy({
      by: ["branchId"],
      where: { restaurantId, createdAt: { gte: startDate }, status: { not: "CANCELLED" } },
      _count: { id: true },
      _sum: { total: true },
    }),
    prisma.order.groupBy({
      by: ["orderType"],
      where: orderWhere,
      _count: { id: true },
      _sum: { total: true },
    }),
    prisma.customer.count({
      where: {
        orders: { some: { restaurantId, createdAt: { gte: startDate } } },
        createdAt: { gte: startDate },
      },
    }),
  ]);

  const totalOrders = orders.length;
  const paidOrders = orders.filter((o) => o.paymentStatus === "PAID");
  const unpaidOrders = orders.filter((o) => o.paymentStatus === "UNPAID");
  const grossRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
  const totalDiscount = orders.reduce((s, o) => s + Number(o.discountAmount), 0);
  const netRevenue = grossRevenue - totalDiscount;
  const avgOrderValue = totalOrders > 0 ? netRevenue / totalOrders : 0;

  const tableIds = tableUsage.map((t) => t.tableId).filter(Boolean) as string[];
  const tables = await prisma.table.findMany({
    where: { id: { in: tableIds } },
    select: { id: true, tableNumber: true },
  });
  const tableMap = new Map(tables.map((t) => [t.id, t.tableNumber]));

  const branchMap = new Map(branches.map((b) => [b.id, b.name]));

  return NextResponse.json({
    period,
    startDate: startDate.toISOString(),
    summary: {
      totalOrders,
      paidOrders: paidOrders.length,
      unpaidOrders: unpaidOrders.length,
      grossRevenue: Math.round(grossRevenue * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      netRevenue: Math.round(netRevenue * 100) / 100,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      waiterRequests: waiterRequestsCount,
      reservations: reservationsCount,
      newCustomers,
    },
    topItems: topItems.map((item) => ({
      menuItemId: item.menuItemId,
      name: item.nameSnapshot,
      quantitySold: item._sum.quantity ?? 0,
      revenue: Math.round(Number(item._sum.totalPrice ?? 0) * 100) / 100,
    })),
    tableUsage: tableUsage.map((t) => ({
      tableId: t.tableId,
      tableNumber: tableMap.get(t.tableId ?? "") ?? "?",
      orderCount: t._count.id,
    })),
    promoUsage: promoUsage.map((p) => ({
      ...p,
      discountValue: Number(p.discountValue),
    })),
    branchBreakdown: ordersByBranch.map((b) => ({
      branchId: b.branchId,
      name: branchMap.get(b.branchId ?? "") ?? "Inconnu",
      orderCount: b._count.id,
      revenue: Math.round(Number(b._sum.total ?? 0) * 100) / 100,
    })),
    orderTypeBreakdown: ordersByType.map((o) => ({
      orderType: o.orderType,
      count: o._count.id,
      revenue: Math.round(Number(o._sum.total ?? 0) * 100) / 100,
    })),
  });
}
