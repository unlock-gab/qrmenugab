import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { MenuPageClient } from "@/components/menu/MenuPageClient";

interface PageProps {
  params: Promise<{ slug: string; token: string }>;
}

export default async function CustomerMenuPage({ params }: PageProps) {
  const { slug, token } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug, status: "ACTIVE" },
  });

  if (!restaurant) notFound();

  const table = await prisma.table.findFirst({
    where: { qrToken: token, restaurantId: restaurant.id, isActive: true },
  });

  if (!table) notFound();

  const categories = await prisma.category.findMany({
    where: { restaurantId: restaurant.id, isActive: true },
    include: {
      menuItems: {
        where: { isAvailable: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const serialized = categories.map((cat) => ({
    ...cat,
    menuItems: cat.menuItems.map((item) => ({
      ...item,
      price: Number(item.price),
    })),
  }));

  return (
    <MenuPageClient
      restaurant={{
        id: restaurant.id,
        name: restaurant.name,
        logoUrl: restaurant.logoUrl,
      }}
      table={{ id: table.id, tableNumber: table.tableNumber }}
      categories={serialized}
    />
  );
}
