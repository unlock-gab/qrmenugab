import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import BranchOrderClient from "./BranchOrderClient";

export default async function BranchOrderPage({
  params,
}: {
  params: Promise<{ restaurantSlug: string; branchSlug: string }>;
}) {
  const { restaurantSlug, branchSlug } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: restaurantSlug },
    select: { id: true, name: true, logoUrl: true, currency: true, primaryColor: true, status: true },
  });
  if (!restaurant || restaurant.status !== "ACTIVE") notFound();

  const branch = await prisma.branch.findFirst({
    where: { restaurantId: restaurant.id, slug: branchSlug, status: "ACTIVE" },
  });
  if (!branch) notFound();

  const categories = await prisma.category.findMany({
    where: { restaurantId: restaurant.id, isActive: true },
    include: {
      menuItems: {
        where: { restaurantId: restaurant.id, isAvailable: true },
        include: {
          optionGroups: {
            include: { options: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const serialized = {
    restaurant: { id: restaurant.id, name: restaurant.name, logoUrl: restaurant.logoUrl, currency: restaurant.currency, primaryColor: restaurant.primaryColor },
    branch: { id: branch.id, name: branch.name, slug: branch.slug, address: branch.address, phone: branch.phone },
    categories: categories.map((cat) => ({
      id: cat.id, name: cat.name, translationsJson: cat.translationsJson,
      menuItems: cat.menuItems.map((item) => ({
        id: item.id, name: item.name, description: item.description,
        translationsJson: item.translationsJson,
        price: Number(item.price),
        imageUrl: item.imageUrl,
        stockTrackingEnabled: item.stockTrackingEnabled,
        stockQuantity: item.stockQuantity,
        optionGroups: item.optionGroups.map((g) => ({
          id: g.id, name: g.name, selectionType: g.selectionType, isRequired: g.isRequired,
          options: g.options.map((o) => ({ id: o.id, name: o.name, extraPrice: Number(o.extraPrice) })),
        })),
      })),
    })),
  };

  return <BranchOrderClient {...serialized} />;
}
