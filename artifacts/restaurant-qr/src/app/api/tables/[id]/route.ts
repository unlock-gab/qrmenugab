import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updateTableSchema = z.object({
  tableNumber: z.string().min(1).max(20).optional(),
  isActive: z.boolean().optional(),
});

async function getTableForMerchant(id: string, restaurantId: string) {
  return prisma.table.findFirst({
    where: { id, restaurantId },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const table = await getTableForMerchant(id, session.user.restaurantId);
  if (!table) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = updateTableSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.table.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const table = await getTableForMerchant(id, session.user.restaurantId);
  if (!table) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.table.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
