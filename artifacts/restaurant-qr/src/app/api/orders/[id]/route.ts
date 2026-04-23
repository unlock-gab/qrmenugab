import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { awardLoyaltyPoints } from "@/lib/loyalty";
import { fireNotification } from "@/lib/notifications";

const updateOrderSchema = z.object({
  status: z.enum(["NEW", "PREPARING", "READY", "SERVED", "PAID", "CANCELLED"]).optional(),
  seenAt: z.string().datetime().optional().nullable(),
  preparedAt: z.string().datetime().optional().nullable(),
  servedAt: z.string().datetime().optional().nullable(),
  paymentMethod: z.enum(["CASH", "CARD", "DIGITAL_WALLET", "ONLINE"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { id, restaurantId: session.user.restaurantId },
  });

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = updateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  const now = new Date();

  if (parsed.data.status !== undefined) {
    updateData.status = parsed.data.status;
    if (parsed.data.status === "PREPARING" && !order.preparedAt) {
      updateData.preparedAt = now;
    }
    if (parsed.data.status === "SERVED" && !order.servedAt) {
      updateData.servedAt = now;
    }
    if (parsed.data.status === "PAID" && !order.paidAt) {
      updateData.paidAt = now;
      updateData.paymentStatus = "PAID";
    }
  }
  if (parsed.data.paymentMethod !== undefined) {
    updateData.paymentMethod = parsed.data.paymentMethod;
  }
  if (parsed.data.seenAt !== undefined) {
    updateData.seenAt = parsed.data.seenAt ? new Date(parsed.data.seenAt) : null;
  }
  if (parsed.data.preparedAt !== undefined) {
    updateData.preparedAt = parsed.data.preparedAt ? new Date(parsed.data.preparedAt) : null;
  }
  if (parsed.data.servedAt !== undefined) {
    updateData.servedAt = parsed.data.servedAt ? new Date(parsed.data.servedAt) : null;
  }

  const updated = await prisma.order.update({
    where: { id },
    data: updateData,
    include: {
      table: { select: { tableNumber: true } },
      orderItems: true,
    },
  });

  // Award loyalty points on PAID
  if (parsed.data.status === "PAID" && order.status !== "PAID") {
    await awardLoyaltyPoints(id, session.user.restaurantId);
    await fireNotification({
      restaurantId: session.user.restaurantId,
      event: "ORDER_PAID",
      recipient: order.customerPhone || "restaurant",
      data: { orderNumber: order.orderNumber },
    });
  }

  // Fire ORDER_READY notification
  if (parsed.data.status === "READY" && order.status !== "READY") {
    await fireNotification({
      restaurantId: session.user.restaurantId,
      event: "ORDER_READY",
      recipient: order.customerPhone || "restaurant",
      data: { orderNumber: order.orderNumber },
    });
  }

  return NextResponse.json({
    ...updated,
    subtotal: Number(updated.subtotal),
    total: Number(updated.total),
    discountAmount: Number(updated.discountAmount),
    orderItems: updated.orderItems.map((i) => ({
      ...i,
      unitPrice: Number(i.unitPrice),
      totalPrice: Number(i.totalPrice),
    })),
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { id, restaurantId: session.user.restaurantId },
    include: {
      table: { select: { tableNumber: true } },
      orderItems: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...order,
    subtotal: Number(order.subtotal),
    total: Number(order.total),
    discountAmount: Number(order.discountAmount),
    orderItems: order.orderItems.map((i) => ({
      ...i,
      unitPrice: Number(i.unitPrice),
      totalPrice: Number(i.totalPrice),
    })),
  });
}
