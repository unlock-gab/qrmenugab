import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const addOptionSchema = z.object({
  groupId: z.string().min(1),
  name: z.string().min(1).max(200),
  extraPrice: z.number().min(0).default(0),
  sortOrder: z.number().int().min(0).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const item = await prisma.menuItem.findFirst({ where: { id, restaurantId: session.user.restaurantId } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = addOptionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const group = await prisma.menuItemOptionGroup.findFirst({
    where: { id: parsed.data.groupId, menuItemId: id },
    include: { options: { select: { sortOrder: true } } },
  });
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  const maxSortOrder = group.options.reduce((max, o) => Math.max(max, o.sortOrder), -1);

  const option = await prisma.menuItemOption.create({
    data: {
      optionGroupId: parsed.data.groupId,
      name: parsed.data.name,
      extraPrice: parsed.data.extraPrice,
      sortOrder: parsed.data.sortOrder ?? maxSortOrder + 1,
    },
  });

  return NextResponse.json({ ...option, extraPrice: Number(option.extraPrice) }, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const optionId = searchParams.get("optionId");

  if (!optionId) return NextResponse.json({ error: "optionId required" }, { status: 400 });

  const item = await prisma.menuItem.findFirst({ where: { id, restaurantId: session.user.restaurantId } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const option = await prisma.menuItemOption.findFirst({
    where: { id: optionId, optionGroup: { menuItemId: id } },
  });
  if (!option) return NextResponse.json({ error: "Option not found" }, { status: 404 });

  await prisma.menuItemOption.delete({ where: { id: optionId } });
  return NextResponse.json({ success: true });
}
