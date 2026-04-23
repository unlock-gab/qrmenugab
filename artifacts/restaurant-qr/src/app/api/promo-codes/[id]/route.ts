import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  isActive: z.boolean().optional(),
  usageLimit: z.number().int().positive().nullable().optional(),
  endsAt: z.string().nullable().optional(),
  minimumOrderAmount: z.number().min(0).nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId || session.user.role !== "MERCHANT_OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const promo = await prisma.promoCode.findFirst({
    where: { id, restaurantId: session.user.restaurantId },
  });
  if (!promo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.promoCode.update({
    where: { id },
    data: {
      ...(parsed.data.isActive !== undefined && { isActive: parsed.data.isActive }),
      ...(parsed.data.usageLimit !== undefined && { usageLimit: parsed.data.usageLimit }),
      ...(parsed.data.endsAt !== undefined && { endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null }),
      ...(parsed.data.minimumOrderAmount !== undefined && { minimumOrderAmount: parsed.data.minimumOrderAmount }),
    },
  });

  return NextResponse.json({ ...updated, discountValue: Number(updated.discountValue) });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId || session.user.role !== "MERCHANT_OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const promo = await prisma.promoCode.findFirst({
    where: { id, restaurantId: session.user.restaurantId },
  });
  if (!promo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.promoCode.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
