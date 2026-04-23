import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { NetworkBanner } from "@/components/NetworkBanner";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = session.user.role;

  if (role === "MERCHANT_OWNER" && session.user.restaurantId) {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: session.user.restaurantId },
      select: { onboardingCompleted: true, status: true },
    });

    if (restaurant && !restaurant.onboardingCompleted) {
      redirect("/onboarding");
    }

    if (restaurant && restaurant.status === "SUSPENDED") {
      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-red-800/50 rounded-2xl p-8 max-w-md text-center">
            <p className="text-4xl mb-4">🚫</p>
            <h1 className="text-xl font-bold text-white mb-3">Account Suspended</h1>
            <p className="text-gray-400">Your restaurant account has been suspended. Please contact platform support.</p>
          </div>
        </div>
      );
    }

    if (restaurant && restaurant.status === "INACTIVE") {
      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md text-center">
            <p className="text-4xl mb-4">⏸️</p>
            <h1 className="text-xl font-bold text-white mb-3">Account Inactive</h1>
            <p className="text-gray-400">Your restaurant is currently inactive. Contact platform support to reactivate.</p>
          </div>
        </div>
      );
    }
  }

  const isMerchant = ["MERCHANT_OWNER", "MERCHANT_STAFF"].includes(role ?? "");

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <NetworkBanner />
      {/* Sidebar — hidden on small screens, shown on md+ */}
      <div className="hidden md:flex">
        <Sidebar user={session.user} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar — mobile nav + notification bell */}
        <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-100 md:px-4 md:py-2 shrink-0">
          {/* Mobile hamburger placeholder — future: slide-out sidebar */}
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
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
