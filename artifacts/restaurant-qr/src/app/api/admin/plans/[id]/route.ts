import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/permissions";
import prisma from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePlatformAdmin();
    const { id } = await params;
    const body = await req.json();
    const { name, description, price, maxTables, maxMenuItems, maxStaffUsers, isActive } = body;

    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: price ? parseFloat(price) : null }),
        ...(maxTables !== undefined && { maxTables }),
        ...(maxMenuItems !== undefined && { maxMenuItems }),
        ...(maxStaffUsers !== undefined && { maxStaffUsers }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(plan);
  } catch {
    return NextResponse.json({ error: "Failed to update plan" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePlatformAdmin();
    const { id } = await params;
    await prisma.subscriptionPlan.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to deactivate plan" }, { status: 500 });
  }
}
