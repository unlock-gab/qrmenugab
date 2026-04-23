import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { TablesClient } from "@/components/dashboard/TablesClient";

export default async function TablesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) return null;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: session.user.restaurantId },
    select: { slug: true },
  });

  const tables = await prisma.table.findMany({
    where: { restaurantId: session.user.restaurantId },
    orderBy: { tableNumber: "asc" },
  });

  return (
    <div className="p-8 max-w-5xl">
      <TablesClient
        initialTables={tables}
        restaurantSlug={restaurant?.slug || ""}
      />
    </div>
  );
}
