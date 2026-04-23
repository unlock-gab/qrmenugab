import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import NotificationsClient from "./NotificationsClient";

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) redirect("/merchant/login");
  if (!["MERCHANT_OWNER", "MERCHANT_STAFF"].includes(session.user.role ?? "")) redirect("/merchant/dashboard");

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: session.user.restaurantId },
    select: {
      notificationsEnabled: true,
      notifyOnNewOrder: true,
      notifyOnOrderReady: true,
      notifyChannels: true,
    },
  });

  const logs = await prisma.notificationLog.findMany({
    where: { restaurantId: session.user.restaurantId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <NotificationsClient
      restaurantId={session.user.restaurantId}
      settings={{
        notificationsEnabled: restaurant?.notificationsEnabled ?? false,
        notifyOnNewOrder: restaurant?.notifyOnNewOrder ?? true,
        notifyOnOrderReady: restaurant?.notifyOnOrderReady ?? true,
        notifyChannels: restaurant?.notifyChannels ?? "[]",
      }}
      initialLogs={logs.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
        sentAt: l.sentAt?.toISOString() ?? null,
      }))}
    />
  );
}
