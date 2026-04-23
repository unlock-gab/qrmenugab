import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { MenuItemsClient } from "@/components/dashboard/MenuItemsClient";

export default async function MenuItemsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) return null;

  const [categories, menuItems] = await Promise.all([
    prisma.category.findMany({
      where: { restaurantId: session.user.restaurantId, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.menuItem.findMany({
      where: { restaurantId: session.user.restaurantId },
      include: { category: { select: { id: true, name: true } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  return (
    <div className="p-8 max-w-5xl">
      <MenuItemsClient initialItems={menuItems} categories={categories} />
    </div>
  );
}
