import { NextRequest, NextResponse } from "next/server";
import { requireMerchantOwner } from "@/lib/permissions";
import prisma from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireMerchantOwner();
    const restaurantId = session.user.restaurantId;
    const { id } = await params;

    const staff = await prisma.user.findFirst({ where: { id, restaurantId, role: "MERCHANT_STAFF" } });
    if (!staff) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { isActive } = await req.json();
    const updated = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: { id: true, name: true, email: true, isActive: true },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
