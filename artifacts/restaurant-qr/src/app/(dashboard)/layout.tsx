import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cache } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { NetworkBanner } from "@/components/NetworkBanner";
import { prisma } from "@/lib/prisma";

// Cache restaurant status check per request — avoids duplicate DB hits during RSC rendering
const getRestaurantStatus = cache(async (restaurantId: string) => {
  return prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { onboardingCompleted: true, status: true },
  });
});

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/merchant/login");

  const role = session.user.role;

  if (role === "MERCHANT_OWNER" && session.user.restaurantId) {
    const restaurant = await getRestaurantStatus(session.user.restaurantId);

    if (restaurant && !restaurant.onboardingCompleted) {
      redirect("/onboarding");
    }

    if (restaurant?.status === "SUSPENDED") {
      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-red-800/50 rounded-2xl p-8 max-w-md text-center">
            <p className="text-4xl mb-4">🚫</p>
            <h1 className="text-xl font-bold text-white mb-3">Compte suspendu</h1>
            <p className="text-gray-400">Votre compte a été suspendu. Contactez le support de la plateforme.</p>
          </div>
        </div>
      );
    }

    if (restaurant?.status === "INACTIVE") {
      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md text-center">
            <p className="text-4xl mb-4">⏸️</p>
            <h1 className="text-xl font-bold text-white mb-3">Compte inactif</h1>
            <p className="text-gray-400">Votre restaurant est actuellement inactif. Contactez le support pour le réactiver.</p>
          </div>
        </div>
      );
    }
  }

  const isMerchant = ["MERCHANT_OWNER", "MERCHANT_STAFF"].includes(role ?? "");

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <NetworkBanner />
      {/* Sidebar — masqué sur mobile, visible sur md+ */}
      <div className="hidden md:flex shrink-0">
        <Sidebar user={session.user} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Barre supérieure : navigation mobile + cloche notifications */}
        <div className="flex items-center justify-between px-4 h-12 bg-white border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2 md:hidden">
            <div className="w-7 h-7 bg-gradient-to-br from-orange-400 to-amber-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">Q</span>
            </div>
            <span className="font-bold text-gray-900 text-sm">QR Menu</span>
          </div>
          <div className="hidden md:block" />
          <div className="flex items-center gap-2">
            {isMerchant && <NotificationBell />}
          </div>
        </div>
        {/* Contenu principal avec scrolling isolé */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
