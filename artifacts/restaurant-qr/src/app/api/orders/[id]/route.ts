import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updateOrderSchema = z.object({
  status: z.enum(["NEW", "PREPARING", "READY", "SERVED", "PAID", "CANCELLED"]).optional(),
  seenAt: z.string().datetime().optional().nullable(),
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
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.seenAt !== undefined) {
    updateData.seenAt = parsed.data.seenAt ? new Date(parsed.data.seenAt) : null;
  }

  const updated = await prisma.order.update({
    where: { id },
    data: updateData,
    include: {
      table: { select: { tableNumber: true } },
      orderItems: true,
    },
  });

  return NextResponse.json(updated);
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

  return NextResponse.json(order);
}
