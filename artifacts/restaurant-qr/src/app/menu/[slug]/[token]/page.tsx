import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { MenuPageClient } from "@/components/menu/MenuPageClient";

interface PageProps {
  params: Promise<{ slug: string; token: string }>;
}

export default async function CustomerMenuPage({ params }: PageProps) {
  const { slug, token } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
  });

  if (!restaurant) notFound();

  if (restaurant.status === "SUSPENDED") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-sm w-full text-center">
          <p className="text-4xl mb-4">🚫</p>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Restaurant Unavailable</h1>
          <p className="text-gray-500 text-sm">This restaurant is temporarily unavailable. Please try again later or contact staff.</p>
        </div>
      </div>
    );
  }

  if (restaurant.status === "INACTIVE" || restaurant.status === "PENDING_SETUP") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-sm w-full text-center">
          <p className="text-4xl mb-4">🍽️</p>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Coming Soon</h1>
          <p className="text-gray-500 text-sm">This restaurant&apos;s online menu is not yet active. Please check back soon.</p>
        </div>
      </div>
    );
  }

  const table = await prisma.table.findFirst({
    where: { qrToken: token, restaurantId: restaurant.id, isActive: true },
  });

  if (!table) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-sm w-full text-center">
          <p className="text-4xl mb-4">🔗</p>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Invalid QR Code</h1>
          <p className="text-gray-500 text-sm">This QR code is not valid or has been deactivated. Please ask staff for help.</p>
        </div>
      </div>
    );
  }

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
        primaryColor: restaurant.primaryColor,
      }}
      table={{ id: table.id, tableNumber: table.tableNumber }}
      categories={serialized}
    />
  );
}
