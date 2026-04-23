import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; token: string }> }
) {
  const { slug, token } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug, status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      phone: true,
      address: true,
      currency: true,
      primaryColor: true,
    },
  });

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  const table = await prisma.table.findFirst({
    where: { qrToken: token, restaurantId: restaurant.id, isActive: true },
    select: { id: true, tableNumber: true },
  });

  if (!table) {
    return NextResponse.json({ error: "Table not found or inactive" }, { status: 404 });
  }

  const categories = await prisma.category.findMany({
    where: { restaurantId: restaurant.id, isActive: true },
    include: {
      menuItems: {
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          description: true,
          ingredientsText: true,
          translationsJson: true,
          price: true,
          imageUrl: true,
          isAvailable: true,
          stockTrackingEnabled: true,
          stockQuantity: true,
          optionGroups: {
            include: {
              options: {
                where: { isActive: true },
                orderBy: { sortOrder: "asc" },
              },
            },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({
    restaurant,
    table,
    categories: categories.map((cat) => ({
      ...cat,
      menuItems: cat.menuItems.map((item) => ({
        ...item,
        price: Number(item.price),
        isOutOfStock: item.stockTrackingEnabled && (item.stockQuantity ?? 0) <= 0,
        optionGroups: item.optionGroups.map((g) => ({
          ...g,
          options: g.options.map((o) => ({
            ...o,
            extraPrice: Number(o.extraPrice),
          })),
        })),
      })),
    })),
  });
}
