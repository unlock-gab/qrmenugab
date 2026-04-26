import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { SettingsClient } from "@/components/dashboard/SettingsClient";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) redirect("/merchant/login");

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: session.user.restaurantId },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      phone: true,
      address: true,
      logoUrl: true,
      coverImageUrl: true,
      currency: true,
      soundEnabled: true,
    },
  });

  if (!restaurant) redirect("/merchant/login");

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Restaurant Settings</h1>
        <p className="text-gray-500 mt-1 text-sm">Manage your restaurant profile and preferences</p>
      </div>
      <SettingsClient restaurant={restaurant} />
    </div>
  );
}
