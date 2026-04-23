import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  code: z.string().min(1).max(50).toUpperCase(),
  discountType: z.enum(["FIXED", "PERCENTAGE"]),
  discountValue: z.number().positive(),
  minimumOrderAmount: z.number().min(0).optional(),
  usageLimit: z.number().int().positive().optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const codes = await prisma.promoCode.findMany({
    where: { restaurantId: session.user.restaurantId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(codes.map((c) => ({
    ...c,
    discountValue: Number(c.discountValue),
    minimumOrderAmount: c.minimumOrderAmount ? Number(c.minimumOrderAmount) : null,
  })));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId || session.user.role !== "MERCHANT_OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { code, discountType, discountValue, minimumOrderAmount, usageLimit, startsAt, endsAt, isActive } = parsed.data;

  const existing = await prisma.promoCode.findUnique({
    where: { restaurantId_code: { restaurantId: session.user.restaurantId, code } },
  });
  if (existing) {
    return NextResponse.json({ error: "Promo code already exists" }, { status: 409 });
  }

  if (discountType === "PERCENTAGE" && discountValue > 100) {
    return NextResponse.json({ error: "Percentage discount cannot exceed 100" }, { status: 400 });
  }

  const promo = await prisma.promoCode.create({
    data: {
      restaurantId: session.user.restaurantId,
      code,
      discountType,
      discountValue,
      minimumOrderAmount: minimumOrderAmount ?? null,
      usageLimit: usageLimit ?? null,
      startsAt: startsAt ? new Date(startsAt) : null,
      endsAt: endsAt ? new Date(endsAt) : null,
      isActive: isActive ?? true,
    },
  });

  return NextResponse.json({ ...promo, discountValue: Number(promo.discountValue) }, { status: 201 });
}
