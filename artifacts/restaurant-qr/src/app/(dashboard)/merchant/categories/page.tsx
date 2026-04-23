import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { CategoriesClient } from "@/components/dashboard/CategoriesClient";

export default async function CategoriesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) return null;

  const categories = await prisma.category.findMany({
    where: { restaurantId: session.user.restaurantId },
    include: { _count: { select: { menuItems: true } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <div className="p-8 max-w-4xl">
      <CategoriesClient initialCategories={categories} />
    </div>
  );
}
