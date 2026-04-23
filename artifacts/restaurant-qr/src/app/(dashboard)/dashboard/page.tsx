import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

const today = () => new Date(new Date().setHours(0, 0, 0, 0));

async function getStats(restaurantId: string) {
  const [
    tableCount,
    menuItemCount,
    newOrders,
    preparingOrders,
    readyOrders,
    todayRevenue,
    recentOrders,
    totalOrdersToday,
    servedPaidToday,
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
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.order.count({
      where: { restaurantId, createdAt: { gte: today() } },
    }),
    prisma.order.count({
      where: {
        restaurantId,
        status: { in: ["SERVED", "PAID"] },
        createdAt: { gte: today() },
      },
    }),
  ]);

  return {
    tableCount,
    menuItemCount,
    newOrders,
    preparingOrders,
    readyOrders,
    todayRevenue: todayRevenue._sum.total ?? 0,
    recentOrders,
    totalOrdersToday,
    servedPaidToday,
  };
}

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  NEW: { label: "New", badge: "bg-blue-100 text-blue-700" },
  PREPARING: { label: "Preparing", badge: "bg-amber-100 text-amber-700" },
  READY: { label: "Ready", badge: "bg-green-100 text-green-700" },
  SERVED: { label: "Served", badge: "bg-gray-100 text-gray-600" },
  PAID: { label: "Paid", badge: "bg-purple-100 text-purple-700" },
  CANCELLED: { label: "Cancelled", badge: "bg-red-100 text-red-600" },
};

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) return null;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: session.user.restaurantId },
  });

  const stats = await getStats(session.user.restaurantId);
  const activeCount = stats.newOrders + stats.preparingOrders + stats.readyOrders;

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {restaurant?.name || "Dashboard"}
        </h1>
        <p className="text-gray-400 text-sm mt-0.5">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Link href="/orders?filter=NEW" className="group bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-3xl font-black text-blue-600">{stats.newOrders}</p>
              <p className="text-sm font-medium text-gray-600 mt-1">New Orders</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl group-hover:bg-blue-100 transition">
              🔔
            </div>
          </div>
          {stats.newOrders > 0 && (
            <div className="mt-3 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-xs text-blue-600 font-medium">Needs attention</span>
            </div>
          )}
        </Link>

        <Link href="/orders?filter=PREPARING" className="group bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-amber-200 hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-3xl font-black text-amber-600">{stats.preparingOrders}</p>
              <p className="text-sm font-medium text-gray-600 mt-1">Preparing</p>
            </div>
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-xl group-hover:bg-amber-100 transition">
              👨‍🍳
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-400">In kitchen</p>
        </Link>

        <Link href="/orders?filter=READY" className="group bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-green-200 hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-3xl font-black text-green-600">{stats.readyOrders}</p>
              <p className="text-sm font-medium text-gray-600 mt-1">Ready to Serve</p>
            </div>
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-xl group-hover:bg-green-100 transition">
              ✅
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-400">Awaiting pickup</p>
        </Link>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-3xl font-black text-gray-900">{formatPrice(stats.todayRevenue)}</p>
              <p className="text-sm font-medium text-gray-600 mt-1">Today&apos;s Revenue</p>
            </div>
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-xl">
              💰
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-400">{stats.servedPaidToday} paid orders</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-2xl font-bold text-gray-900">{stats.totalOrdersToday}</p>
          <p className="text-sm text-gray-500 mt-0.5">Orders Today</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-2xl font-bold text-gray-900">{stats.tableCount}</p>
          <p className="text-sm text-gray-500 mt-0.5">Active Tables</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-2xl font-bold text-gray-900">{stats.menuItemCount}</p>
          <p className="text-sm text-gray-500 mt-0.5">Menu Items</p>
        </div>
      </div>

      {stats.recentOrders.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Active Orders</h2>
              <p className="text-xs text-gray-400 mt-0.5">{activeCount} orders need action</p>
            </div>
            <Link href="/orders" className="text-sm text-orange-500 hover:text-orange-600 font-semibold">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.recentOrders.map((order) => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.NEW;
              return (
                <div key={order.id} className="px-6 py-3.5 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-900">{order.orderNumber}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Table {order.table.tableNumber} &bull;{" "}
                      {order.orderItems.slice(0, 2).map((i) => `${i.quantity}× ${i.nameSnapshot}`).join(", ")}
                      {order.orderItems.length > 2 ? ` +${order.orderItems.length - 2}` : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm text-gray-900">{formatPrice(order.total)}</p>
                    <p className="text-xs text-gray-400">{timeAgo(order.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="text-gray-500 font-medium">No active orders right now</p>
          <p className="text-gray-400 text-sm mt-1">New orders will appear here automatically</p>
        </div>
      )}
    </div>
  );
}
