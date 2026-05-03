import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { OnboardingClient } from "@/components/onboarding/OnboardingClient";

export const metadata = { title: "Configuration du restaurant — QRMenu" };

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/merchant/login");
  if (session.user.role !== "MERCHANT_OWNER") redirect("/merchant/dashboard");

  const restaurantId = session.user.restaurantId;
  if (!restaurantId) redirect("/merchant/login");

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: { _count: { select: { tables: true, categories: true, menuItems: true } } },
  });

  if (!restaurant) redirect("/merchant/login");
  if (restaurant.onboardingCompleted) redirect("/merchant/dashboard");

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
        city: restaurant.city,
        restaurantType: restaurant.restaurantType,
        logoUrl: restaurant.logoUrl,
        tablesCount: restaurant._count.tables,
        categoriesCount: restaurant._count.categories,
        menuItemsCount: restaurant._count.menuItems,
        onboardingStep: restaurant.onboardingStep ?? 0,
      }}
      categories={categories}
    />
  );
}
