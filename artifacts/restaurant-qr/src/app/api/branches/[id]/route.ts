import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updateBranchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  address: z.string().max(300).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

async function getBranchForMerchant(id: string, restaurantId: string) {
  return prisma.branch.findFirst({ where: { id, restaurantId } });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const branch = await getBranchForMerchant(id, session.user.restaurantId);
  if (!branch) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateBranchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.branch.update({
    where: { id },
    data: parsed.data,
    include: { _count: { select: { tables: true, orders: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const branch = await getBranchForMerchant(id, session.user.restaurantId);
  if (!branch) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (branch.isDefault) return NextResponse.json({ error: "Cannot delete the default branch" }, { status: 400 });

  const tableCount = await prisma.table.count({ where: { branchId: id } });
  if (tableCount > 0) return NextResponse.json({ error: "Remove all tables from this branch first" }, { status: 400 });

  await prisma.branch.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
