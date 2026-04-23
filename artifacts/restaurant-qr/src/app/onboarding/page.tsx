import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { OnboardingClient } from "@/components/onboarding/OnboardingClient";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "MERCHANT_OWNER") redirect("/dashboard");

  const restaurantId = session.user.restaurantId;
  if (!restaurantId) redirect("/login");

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: { _count: { select: { tables: true, categories: true, menuItems: true } } },
  });

  if (!restaurant) redirect("/login");
  if (restaurant.onboardingCompleted) redirect("/dashboard");

  const categories = await prisma.category.findMany({
    where: { restaurantId },
    select: { id: true, name: true },
  });

  return (
    <OnboardingClient
      restaurant={{
        id: restaurant.id,
        name: restaurant.name,
        description: restaurant.description,
        phone: restaurant.phone,
        address: restaurant.address,
        tablesCount: restaurant._count.tables,
        categoriesCount: restaurant._count.categories,
        menuItemsCount: restaurant._count.menuItems,
      }}
      categories={categories}
    />
  );
}
