import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCashierAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  paymentMethod: z.enum(["CASH", "CARD", "TRANSFER", "OTHER"]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireCashierAccess();
    const restaurantId = session.user.restaurantId;
    if (!restaurantId) return NextResponse.json({ error: "No restaurant" }, { status: 400 });

    const { id } = await params;
    const order = await prisma.order.findFirst({
      where: { id, restaurantId },
    });

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.paymentStatus === "PAID") return NextResponse.json({ error: "Order already paid" }, { status: 400 });

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });

    const updated = await prisma.order.update({
      where: { id },
      data: {
        paymentStatus: "PAID",
        paymentMethod: parsed.data.paymentMethod,
        status: "PAID",
        paidAt: new Date(),
      },
      include: {
        table: { select: { tableNumber: true } },
        orderItems: true,
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
