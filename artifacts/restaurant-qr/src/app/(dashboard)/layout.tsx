import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import prisma from "@/lib/prisma";

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

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar user={session.user} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
