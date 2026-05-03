import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { QRCenterClient } from "@/components/dashboard/QRCenterClient";

export const metadata = { title: "Centre QR — QRMenu" };

export default async function QRCenterPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) redirect("/merchant/login");

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: session.user.restaurantId },
    select: { name: true, slug: true, logoUrl: true },
  });

  if (!restaurant) redirect("/merchant/login");

  const tables = await prisma.table.findMany({
    where: { restaurantId: session.user.restaurantId },
    select: {
      id: true, tableNumber: true, qrToken: true, isActive: true, branchId: true,
      branch: { select: { name: true } },
    },
    orderBy: { tableNumber: "asc" },
  });

  const mapped = tables.map((t) => ({
    id: t.id,
    tableNumber: t.tableNumber,
    qrToken: t.qrToken,
    isActive: t.isActive,
    branchId: t.branchId,
    branchName: t.branch?.name ?? null,
  }));

  return (
    <div className="p-6 max-w-7xl">
      <QRCenterClient
        tables={mapped}
        restaurantSlug={restaurant.slug}
        restaurantName={restaurant.name}
        logoUrl={restaurant.logoUrl}
      />
    </div>
  );
}
