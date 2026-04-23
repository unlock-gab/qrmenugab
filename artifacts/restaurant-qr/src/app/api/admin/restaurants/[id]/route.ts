import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/permissions";
import prisma from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePlatformAdmin();
    const { id } = await params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        users: { select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true } },
        subscription: { include: { plan: true } },
        _count: { select: { tables: true, menuItems: true, orders: true, categories: true } },
      },
    });

    if (!restaurant) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(restaurant);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePlatformAdmin();
    const { id } = await params;
    const body = await req.json();

    const { name, phone, address, status, primaryColor, planId, subscriptionStatus } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (status !== undefined) updateData.status = status;
    if (primaryColor !== undefined) updateData.primaryColor = primaryColor;

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: updateData,
    });

    if (planId && subscriptionStatus) {
      await prisma.restaurantSubscription.upsert({
        where: { restaurantId: id },
        update: { planId, status: subscriptionStatus },
        create: {
          restaurantId: id,
          planId,
          status: subscriptionStatus,
          startDate: new Date(),
        },
      });
    } else if (planId) {
      await prisma.restaurantSubscription.upsert({
        where: { restaurantId: id },
        update: { planId },
        create: {
          restaurantId: id,
          planId,
          status: "ACTIVE",
          startDate: new Date(),
        },
      });
    }

    return NextResponse.json(restaurant);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePlatformAdmin();
    const { id } = await params;
    await prisma.restaurant.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
