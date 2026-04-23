import { NextResponse } from "next/server";
import { requireMerchant } from "@/lib/permissions";
import { getUsageSummary } from "@/lib/limits";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await requireMerchant();
    const restaurantId = session.user.restaurantId;
    if (!restaurantId) return NextResponse.json({ error: "No restaurant" }, { status: 400 });

    const [subscription, usage] = await Promise.all([
      prisma.restaurantSubscription.findUnique({
        where: { restaurantId },
        include: { plan: true },
      }),
      getUsageSummary(restaurantId),
    ]);

    return NextResponse.json({ subscription, usage });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
