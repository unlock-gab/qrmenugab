import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { code, restaurantId, orderTotal } = await req.json();

  if (!code || !restaurantId) {
    return NextResponse.json({ error: "Missing code or restaurantId" }, { status: 400 });
  }

  const promo = await prisma.promoCode.findUnique({
    where: { restaurantId_code: { restaurantId, code: code.toUpperCase() } },
  });

  if (!promo || !promo.isActive) {
    return NextResponse.json({ error: "Invalid or inactive promo code" }, { status: 400 });
  }

  const now = new Date();
  if (promo.startsAt && promo.startsAt > now) {
    return NextResponse.json({ error: "Promo code not yet active" }, { status: 400 });
  }
  if (promo.endsAt && promo.endsAt < now) {
    return NextResponse.json({ error: "Promo code has expired" }, { status: 400 });
  }
  if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) {
    return NextResponse.json({ error: "Promo code usage limit reached" }, { status: 400 });
  }

  const minAmount = promo.minimumOrderAmount ? Number(promo.minimumOrderAmount) : 0;
  if (orderTotal !== undefined && orderTotal < minAmount) {
    return NextResponse.json({
      error: `Minimum order amount is ${minAmount}`,
      minimumOrderAmount: minAmount,
    }, { status: 400 });
  }

  const discountValue = Number(promo.discountValue);
  let discountAmount = 0;
  if (promo.discountType === "FIXED") {
    discountAmount = Math.min(discountValue, orderTotal ?? discountValue);
  } else {
    discountAmount = ((orderTotal ?? 0) * discountValue) / 100;
  }

  return NextResponse.json({
    valid: true,
    promoCodeId: promo.id,
    discountType: promo.discountType,
    discountValue,
    discountAmount: Math.round(discountAmount * 100) / 100,
  });
}
