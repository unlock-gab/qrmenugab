import { NextRequest, NextResponse } from "next/server";
import { getCustomerFromCookies } from "@/lib/customerAuth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const payload = await getCustomerFromCookies();
  if (!payload) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const restaurantId = searchParams.get("restaurantId");

  const where = restaurantId
    ? { customerId: payload.id, restaurantId }
    : { customerId: payload.id };

  const accounts = await prisma.loyaltyAccount.findMany({
    where,
    include: {
      restaurant: { select: { name: true, currency: true, pointsPerUnit: true } },
      transactions: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  return NextResponse.json(accounts);
}
