import prisma from "@/lib/prisma";

export async function awardLoyaltyPoints(orderId: string, restaurantId: string): Promise<void> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, customerId: true, total: true, restaurantId: true },
    });
    if (!order?.customerId) return;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { pointsPerUnit: true },
    });
    const ppu = Number(restaurant?.pointsPerUnit ?? 1);
    const orderTotal = Number(order.total);
    const pointsToAward = Math.floor(orderTotal * ppu);
    if (pointsToAward <= 0) return;

    // Upsert loyalty account
    const account = await prisma.loyaltyAccount.upsert({
      where: { customerId_restaurantId: { customerId: order.customerId, restaurantId } },
      create: { customerId: order.customerId, restaurantId, pointsBalance: 0 },
      update: {},
    });

    // Create transaction + increment balance
    await prisma.$transaction([
      prisma.loyaltyTransaction.create({
        data: {
          loyaltyAccountId: account.id,
          orderId,
          type: "EARN",
          pointsDelta: pointsToAward,
          note: `طلب #${orderId.slice(-6)} — كسب ${pointsToAward} نقطة`,
        },
      }),
      prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: { pointsBalance: { increment: pointsToAward } },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: { loyaltyPointsAwarded: pointsToAward },
      }),
    ]);
  } catch (err) {
    console.error("[Loyalty] Failed to award points:", err);
  }
}
