import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireWaiterAccess } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/utils";

const schema = z.object({
  tableId: z.string().min(1),
  notes: z.string().max(500).optional(),
  items: z.array(
    z.object({
      menuItemId: z.string().min(1),
      quantity: z.number().int().positive().max(99),
    })
  ).min(1),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireWaiterAccess();
    const restaurantId = session.user.restaurantId;
    if (!restaurantId) return NextResponse.json({ error: "No restaurant" }, { status: 400 });

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });

    const { tableId, notes, items } = parsed.data;

    const table = await prisma.table.findFirst({
      where: { id: tableId, restaurantId, isActive: true },
    });
    if (!table) return NextResponse.json({ error: "Table not found" }, { status: 404 });

    const menuItemIds = items.map((i) => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, restaurantId, isAvailable: true },
    });
    if (menuItems.length !== menuItemIds.length) {
      return NextResponse.json({ error: "Some items unavailable" }, { status: 400 });
    }

    const itemMap = new Map(menuItems.map((m) => [m.id, m]));
    let subtotal = 0;
    const orderItemsData = items.map((item) => {
      const mi = itemMap.get(item.menuItemId)!;
      const unitPrice = Number(mi.price);
      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;
      return { menuItemId: item.menuItemId, nameSnapshot: mi.name, unitPrice, quantity: item.quantity, totalPrice };
    });

    const order = await prisma.order.create({
      data: {
        restaurantId,
        tableId,
        orderNumber: generateOrderNumber(),
        notes: notes || null,
        subtotal,
        total: subtotal,
        orderSource: "MANUAL",
        paymentStatus: "UNPAID",
        orderItems: { create: orderItemsData },
      },
      include: {
        table: { select: { tableNumber: true } },
        orderItems: true,
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
