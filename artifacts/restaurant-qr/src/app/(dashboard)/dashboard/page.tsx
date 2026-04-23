import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

async function getStats(restaurantId: string) {
  const [tableCount, categoryCount, menuItemCount, todayOrders, recentOrders] =
    await Promise.all([
      prisma.table.count({ where: { restaurantId, isActive: true } }),
      prisma.category.count({ where: { restaurantId, isActive: true } }),
      prisma.menuItem.count({ where: { restaurantId, isAvailable: true } }),
      prisma.order.count({
        where: {
          restaurantId,
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      prisma.order.findMany({
        where: { restaurantId, status: { in: ["NEW", "PREPARING", "READY"] } },
        include: { table: { select: { tableNumber: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  return { tableCount, categoryCount, menuItemCount, todayOrders, recentOrders };
}

const statusColors: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  PREPARING: "bg-yellow-100 text-yellow-700",
  READY: "bg-green-100 text-green-700",
  SERVED: "bg-gray-100 text-gray-700",
  PAID: "bg-purple-100 text-purple-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) return null;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: session.user.restaurantId },
  });

  const stats = await getStats(session.user.restaurantId);

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {restaurant?.name || "Dashboard"}
        </h1>
        <p className="text-gray-500 mt-1">Overview of your restaurant</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Active Tables", value: stats.tableCount, icon: "🪑", color: "from-blue-500 to-blue-600" },
          { label: "Categories", value: stats.categoryCount, icon: "📋", color: "from-purple-500 to-purple-600" },
          { label: "Menu Items", value: stats.menuItemCount, icon: "🍽️", color: "from-orange-500 to-amber-500" },
          { label: "Orders Today", value: stats.todayOrders, icon: "📦", color: "from-green-500 to-emerald-500" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-lg mb-3`}>
              {stat.icon}
            </div>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {stats.recentOrders.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Orders</h2>
          <div className="space-y-3">
            {stats.recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{order.orderNumber}</p>
                  <p className="text-sm text-gray-500">Table {order.table.tableNumber}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[order.status]}`}>
                    {order.status}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <a href="/orders" className="mt-4 block text-center text-sm text-orange-500 hover:text-orange-600 font-medium">
            View all orders →
          </a>
        </div>
      )}
    </div>
  );
}
