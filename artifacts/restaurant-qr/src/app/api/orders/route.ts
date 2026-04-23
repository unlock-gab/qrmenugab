import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { generateOrderNumber } from "@/lib/utils";

const createOrderSchema = z.object({
  tableId: z.string().min(1),
  restaurantId: z.string().min(1),
  notes: z.string().max(500).optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const orders = await prisma.order.findMany({
    where: {
      restaurantId: session.user.restaurantId,
      ...(status ? { status: status as never } : {}),
    },
    include: {
      table: { select: { tableNumber: true } },
      orderItems: {
        include: { menuItem: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { tableId, restaurantId, notes, items } = parsed.data;

  const table = await prisma.table.findFirst({
    where: { id: tableId, restaurantId, isActive: true },
  });

  if (!table) {
    return NextResponse.json({ error: "Table not found or inactive" }, { status: 404 });
  }

  const menuItemIds = items.map((i) => i.menuItemId);
  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: { in: menuItemIds },
      restaurantId,
      isAvailable: true,
    },
  });

  if (menuItems.length !== menuItemIds.length) {
    return NextResponse.json(
      { error: "Some items are unavailable or not found" },
      { status: 400 }
    );
  }

  const itemMap = new Map(menuItems.map((m) => [m.id, m]));

  let subtotal = 0;
  const orderItemsData = items.map((item) => {
    const menuItem = itemMap.get(item.menuItemId)!;
    const unitPrice = Number(menuItem.price);
    const totalPrice = unitPrice * item.quantity;
    subtotal += totalPrice;
    return {
      menuItemId: item.menuItemId,
      nameSnapshot: menuItem.name,
      unitPrice,
      quantity: item.quantity,
      totalPrice,
    };
  });

  const order = await prisma.order.create({
    data: {
      restaurantId,
      tableId,
      orderNumber: generateOrderNumber(),
      notes: notes || null,
      subtotal,
      total: subtotal,
      orderItems: { create: orderItemsData },
    },
    include: {
      table: { select: { tableNumber: true } },
      orderItems: true,
    },
  });

  return NextResponse.json(order, { status: 201 });
}
