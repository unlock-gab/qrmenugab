import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const optionGroupSchema = z.object({
  name: z.string().min(1).max(200),
  selectionType: z.enum(["SINGLE", "MULTIPLE"]).default("SINGLE"),
  isRequired: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
  options: z.array(z.object({
    name: z.string().min(1).max(200),
    extraPrice: z.number().min(0).default(0),
    sortOrder: z.number().int().min(0).default(0),
  })).min(1),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const item = await prisma.menuItem.findFirst({
    where: { id, restaurantId: session.user.restaurantId },
    include: {
      optionGroups: {
        include: { options: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(item.optionGroups.map((g) => ({
    ...g,
    options: g.options.map((o) => ({ ...o, extraPrice: Number(o.extraPrice) })),
  })));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const item = await prisma.menuItem.findFirst({
    where: { id, restaurantId: session.user.restaurantId },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = optionGroupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, selectionType, isRequired, sortOrder, options } = parsed.data;

  const group = await prisma.menuItemOptionGroup.create({
    data: {
      menuItemId: id,
      name,
      selectionType,
      isRequired,
      sortOrder,
      options: {
        create: options.map((o) => ({
          name: o.name,
          extraPrice: o.extraPrice,
          sortOrder: o.sortOrder,
        })),
      },
    },
    include: { options: true },
  });

  return NextResponse.json({
    ...group,
    options: group.options.map((o) => ({ ...o, extraPrice: Number(o.extraPrice) })),
  }, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { groupId } = await req.json();

  if (!groupId) return NextResponse.json({ error: "Missing groupId" }, { status: 400 });

  const item = await prisma.menuItem.findFirst({
    where: { id, restaurantId: session.user.restaurantId },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.menuItemOptionGroup.delete({ where: { id: groupId, menuItemId: id } });
  return NextResponse.json({ success: true });
}
