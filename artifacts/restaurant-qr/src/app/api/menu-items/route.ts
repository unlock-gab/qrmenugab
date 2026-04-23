import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { checkMenuItemLimit } from "@/lib/limits";
import { z } from "zod";

const createMenuItemSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  ingredientsText: z.string().max(500).optional(),
  translationsJson: z.string().optional(),
  price: z.number().positive(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  sortOrder: z.number().int().min(0).optional().default(0),
  stockTrackingEnabled: z.boolean().optional().default(false),
  stockQuantity: z.number().int().min(0).optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await prisma.menuItem.findMany({
    where: { restaurantId: session.user.restaurantId },
    include: { category: { select: { id: true, name: true } } },
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createMenuItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const limit = await checkMenuItemLimit(session.user.restaurantId);
  if (!limit.allowed) {
    return NextResponse.json({
      error: `Menu item limit reached (${limit.current}/${limit.max}). Upgrade your plan to add more items.`,
      limitReached: true,
    }, { status: 403 });
  }

  const category = await prisma.category.findFirst({
    where: { id: parsed.data.categoryId, restaurantId: session.user.restaurantId },
  });

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 400 });
  }

  const { stockTrackingEnabled, stockQuantity, ingredientsText, translationsJson, ...rest } = parsed.data;
  const item = await prisma.menuItem.create({
    data: {
      restaurantId: session.user.restaurantId,
      categoryId: rest.categoryId,
      name: rest.name,
      description: rest.description || null,
      ingredientsText: ingredientsText || null,
      translationsJson: translationsJson || null,
      price: rest.price,
      imageUrl: rest.imageUrl || null,
      sortOrder: rest.sortOrder,
      stockTrackingEnabled: stockTrackingEnabled ?? false,
      stockQuantity: (stockTrackingEnabled && stockQuantity != null) ? stockQuantity : null,
    },
    include: { category: { select: { id: true, name: true } } },
  });

  return NextResponse.json(item, { status: 201 });
}
