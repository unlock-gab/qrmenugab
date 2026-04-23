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
  promoCode: z.string().optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        quantity: z.number().int().positive(),
        selectedOptions: z.array(z.object({
          optionId: z.string().min(1),
          name: z.string(),
          extraPrice: z.number().min(0),
        })).optional().default([]),
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
        include: {
          menuItem: { select: { name: true } },
          orderItemOptions: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(orders.map((o) => ({
    ...o,
    subtotal: Number(o.subtotal),
    total: Number(o.total),
    discountAmount: Number(o.discountAmount),
    finalTotal: Number(o.total) - Number(o.discountAmount),
    orderItems: o.orderItems.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
      orderItemOptions: item.orderItemOptions.map((opt) => ({
        ...opt,
        extraPrice: Number(opt.extraPrice),
      })),
    })),
  })));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { tableId, restaurantId, notes, items, promoCode } = parsed.data;

  const table = await prisma.table.findFirst({
    where: { id: tableId, restaurantId, isActive: true },
  });

  if (!table) {
    return NextResponse.json({ error: "Table not found or inactive" }, { status: 404 });
  }

  const menuItemIds = items.map((i) => i.menuItemId);
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: menuItemIds }, restaurantId },
    include: { optionGroups: { include: { options: true } } },
  });

  const unavailableItems = menuItems.filter((m) => !m.isAvailable);
  if (unavailableItems.length > 0) {
    return NextResponse.json(
      { error: `Items unavailable: ${unavailableItems.map((i) => i.name).join(", ")}` },
      { status: 400 }
    );
  }

  if (menuItems.length !== menuItemIds.length) {
    return NextResponse.json({ error: "Some items not found" }, { status: 400 });
  }

  const outOfStock = menuItems.filter(
    (m) => m.stockTrackingEnabled && (m.stockQuantity ?? 0) <= 0
  );
  if (outOfStock.length > 0) {
    return NextResponse.json(
      { error: `Out of stock: ${outOfStock.map((i) => i.name).join(", ")}` },
      { status: 400 }
    );
  }

  const itemMap = new Map(menuItems.map((m) => [m.id, m]));

  let subtotal = 0;
  const orderItemsData = items.map((item) => {
    const menuItem = itemMap.get(item.menuItemId)!;
    const basePrice = Number(menuItem.price);
    const optionsExtraPrice = item.selectedOptions.reduce((s, o) => s + o.extraPrice, 0);
    const unitPrice = basePrice + optionsExtraPrice;
    const totalPrice = unitPrice * item.quantity;
    subtotal += totalPrice;

    const optionSnapshots = item.selectedOptions.length > 0
      ? JSON.stringify(item.selectedOptions.map((o) => ({ name: o.name, extraPrice: o.extraPrice })))
      : null;

    return {
      menuItemId: item.menuItemId,
      nameSnapshot: menuItem.name,
      unitPrice,
      quantity: item.quantity,
      totalPrice,
      optionSnapshots,
      selectedOptionIds: item.selectedOptions.map((o) => o.optionId),
      selectedOptionNames: item.selectedOptions.map((o) => o.name),
      selectedOptionPrices: item.selectedOptions.map((o) => o.extraPrice),
    };
  });

  let discountAmount = 0;
  let promoCodeId: string | null = null;
  let discountCodeStr: string | null = null;

  if (promoCode) {
    const promo = await prisma.promoCode.findUnique({
      where: { restaurantId_code: { restaurantId, code: promoCode.toUpperCase() } },
    });

    if (promo && promo.isActive) {
      const now = new Date();
      const validTime = (!promo.startsAt || promo.startsAt <= now) && (!promo.endsAt || promo.endsAt >= now);
      const withinLimit = promo.usageLimit === null || promo.usedCount < promo.usageLimit;
      const meetsMinimum = !promo.minimumOrderAmount || subtotal >= Number(promo.minimumOrderAmount);

      if (validTime && withinLimit && meetsMinimum) {
        const dv = Number(promo.discountValue);
        discountAmount = promo.discountType === "FIXED"
          ? Math.min(dv, subtotal)
          : (subtotal * dv) / 100;
        discountAmount = Math.round(discountAmount * 100) / 100;
        promoCodeId = promo.id;
        discountCodeStr = promo.code;
      }
    }
  }

  const finalTotal = Math.max(0, subtotal - discountAmount);

  const order = await prisma.$transaction(async (tx) => {
    if (promoCodeId) {
      await tx.promoCode.update({
        where: { id: promoCodeId },
        data: { usedCount: { increment: 1 } },
      });
    }

    for (const item of items) {
      const menuItem = itemMap.get(item.menuItemId)!;
      if (menuItem.stockTrackingEnabled && menuItem.stockQuantity !== null) {
        const updatedItem = await tx.menuItem.update({
          where: { id: menuItem.id },
          data: {
            stockQuantity: { decrement: item.quantity },
          },
        });
        if ((updatedItem.stockQuantity ?? 0) < 0) {
          throw new Error(`Insufficient stock for: ${menuItem.name}`);
        }
        if ((updatedItem.stockQuantity ?? 0) === 0) {
          await tx.menuItem.update({
            where: { id: menuItem.id },
            data: { isAvailable: false },
          });
        }
      }
    }

    const newOrder = await tx.order.create({
      data: {
        restaurantId,
        tableId,
        orderNumber: generateOrderNumber(),
        notes: notes || null,
        subtotal,
        total: subtotal,
        discountAmount,
        discountCode: discountCodeStr,
        promoCodeId,
        orderItems: {
          create: orderItemsData.map((d) => ({
            menuItemId: d.menuItemId,
            nameSnapshot: d.nameSnapshot,
            unitPrice: d.unitPrice,
            quantity: d.quantity,
            totalPrice: d.totalPrice,
            optionSnapshots: d.optionSnapshots,
            orderItemOptions: d.selectedOptionIds.length > 0
              ? {
                  create: d.selectedOptionIds.map((optId, i) => ({
                    optionId: optId,
                    nameSnapshot: d.selectedOptionNames[i],
                    extraPrice: d.selectedOptionPrices[i],
                  })),
                }
              : undefined,
          })),
        },
      },
      include: {
        table: { select: { tableNumber: true } },
        orderItems: {
          include: { orderItemOptions: true },
        },
      },
    });

    return newOrder;
  });

  return NextResponse.json({
    ...order,
    subtotal: Number(order.subtotal),
    total: Number(order.total),
    discountAmount: Number(order.discountAmount),
    finalTotal,
    orderItems: order.orderItems.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
    })),
  }, { status: 201 });
}
