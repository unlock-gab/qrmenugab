import prisma from "@/lib/prisma";

export async function getRestaurantLimits(restaurantId: string) {
  const subscription = await prisma.restaurantSubscription.findUnique({
    where: { restaurantId },
    include: { plan: true },
  });

  if (!subscription || !subscription.plan) {
    return { maxTables: 5, maxMenuItems: 20, maxStaffUsers: 1 };
  }

  return {
    maxTables: subscription.plan.maxTables,
    maxMenuItems: subscription.plan.maxMenuItems,
    maxStaffUsers: subscription.plan.maxStaffUsers,
  };
}

export async function checkTableLimit(restaurantId: string) {
  const [limits, count] = await Promise.all([
    getRestaurantLimits(restaurantId),
    prisma.table.count({ where: { restaurantId } }),
  ]);
  return {
    allowed: count < limits.maxTables,
    current: count,
    max: limits.maxTables,
  };
}

export async function checkMenuItemLimit(restaurantId: string) {
  const [limits, count] = await Promise.all([
    getRestaurantLimits(restaurantId),
    prisma.menuItem.count({ where: { restaurantId } }),
  ]);
  return {
    allowed: count < limits.maxMenuItems,
    current: count,
    max: limits.maxMenuItems,
  };
}

export async function checkStaffLimit(restaurantId: string) {
  const [limits, count] = await Promise.all([
    getRestaurantLimits(restaurantId),
    prisma.user.count({
      where: { restaurantId, role: "MERCHANT_STAFF", isActive: true },
    }),
  ]);
  return {
    allowed: count < limits.maxStaffUsers,
    current: count,
    max: limits.maxStaffUsers,
  };
}

export async function getUsageSummary(restaurantId: string) {
  const [limits, tableCount, menuItemCount, staffCount] = await Promise.all([
    getRestaurantLimits(restaurantId),
    prisma.table.count({ where: { restaurantId } }),
    prisma.menuItem.count({ where: { restaurantId } }),
    prisma.user.count({ where: { restaurantId, role: "MERCHANT_STAFF", isActive: true } }),
  ]);

  return {
    tables: { current: tableCount, max: limits.maxTables },
    menuItems: { current: menuItemCount, max: limits.maxMenuItems },
    staff: { current: staffCount, max: limits.maxStaffUsers },
  };
}
