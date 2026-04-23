import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCustomerFromRequest } from "@/lib/customerAuth";
import { fireNotification } from "@/lib/notifications";
import { z } from "zod";

const schema = z.object({
  restaurantId: z.string().min(1),
  branchId: z.string().min(1),
  orderType: z.enum(["TAKEAWAY", "DELIVERY"]),
  customerName: z.string().min(1).max(100),
  customerPhone: z.string().min(1).max(30),
  deliveryAddress: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
  promoCode: z.string().optional(),
  items: z.array(z.object({
    menuItemId: z.string(),
    quantity: z.number().int().positive(),
    selectedOptions: z.array(z.object({
      optionId: z.string(),
      groupId: z.string(),
    })).optional().default([]),
  })).min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { restaurantId, branchId, orderType, customerName, customerPhone, deliveryAddress, notes, promoCode, items } = parsed.data;

  if (orderType === "DELIVERY" && !deliveryAddress) {
    return NextResponse.json({ error: "Delivery address required" }, { status: 400 });
  }

  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant) return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });

  const branch = await prisma.branch.findFirst({ where: { id: branchId, restaurantId, status: "ACTIVE" } });
  if (!branch) return NextResponse.json({ error: "Branch not found" }, { status: 404 });

  // Get customer if logged in
  const customerPayload = await getCustomerFromRequest(req);
  const customerId = customerPayload?.id || null;

  // Load menu items
  const menuItemIds = items.map((i) => i.menuItemId);
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: menuItemIds }, restaurantId, isAvailable: true },
    include: { optionGroups: { include: { options: { where: { isActive: true } } } } },
  });
  const menuItemMap = new Map(menuItems.map((m) => [m.id, m]));

  // Validate items and calculate subtotal
  let subtotal = 0;
  const orderItemsData: Array<{
    menuItemId: string; nameSnapshot: string; unitPrice: number; quantity: number;
    totalPrice: number; selectedOptions: Array<{ optionId: string; nameSnapshot: string; extraPrice: number }>;
  }> = [];

  for (const item of items) {
    const mi = menuItemMap.get(item.menuItemId);
    if (!mi) return NextResponse.json({ error: `Item not available: ${item.menuItemId}` }, { status: 400 });
    if (mi.stockTrackingEnabled && (mi.stockQuantity ?? 0) < item.quantity) {
      return NextResponse.json({ error: `Insufficient stock for: ${mi.name}` }, { status: 400 });
    }

    let optionsPrice = 0;
    const selectedOptions: Array<{ optionId: string; nameSnapshot: string; extraPrice: number }> = [];
    for (const sel of item.selectedOptions) {
      const group = mi.optionGroups.find((g) => g.id === sel.groupId);
      const opt = group?.options.find((o) => o.id === sel.optionId);
      if (opt) {
        optionsPrice += Number(opt.extraPrice);
        selectedOptions.push({ optionId: opt.id, nameSnapshot: opt.name, extraPrice: Number(opt.extraPrice) });
      }
    }

    const unitPrice = Number(mi.price) + optionsPrice;
    const totalPrice = unitPrice * item.quantity;
    subtotal += totalPrice;
    orderItemsData.push({ menuItemId: mi.id, nameSnapshot: mi.name, unitPrice, quantity: item.quantity, totalPrice, selectedOptions });
  }

  // Promo validation
  let discountAmount = 0;
  let promoCodeId: string | null = null;
  let discountCodeSnapshot: string | null = null;

  if (promoCode) {
    const promo = await prisma.promoCode.findFirst({
      where: { restaurantId, code: promoCode, isActive: true },
    });
    if (promo && (!promo.usageLimit || promo.usedCount < promo.usageLimit)) {
      const now = new Date();
      if ((!promo.startsAt || promo.startsAt <= now) && (!promo.endsAt || promo.endsAt >= now)) {
        if (!promo.minimumOrderAmount || subtotal >= Number(promo.minimumOrderAmount)) {
          discountAmount = promo.discountType === "PERCENTAGE"
            ? (subtotal * Number(promo.discountValue)) / 100
            : Math.min(subtotal, Number(promo.discountValue));
          promoCodeId = promo.id;
          discountCodeSnapshot = promo.code;
        }
      }
    }
  }

  const total = subtotal - discountAmount;

  // Generate order number
  const lastOrder = await prisma.order.findFirst({
    where: { restaurantId },
    orderBy: { createdAt: "desc" },
    select: { orderNumber: true },
  });
  const nextNum = lastOrder ? parseInt(lastOrder.orderNumber.replace(/\D/g, "") || "0") + 1 : 1;
  const orderNumber = String(nextNum).padStart(4, "0");

  const order = await prisma.$transaction(async (tx) => {
    // Decrement stock
    for (const item of items) {
      const mi = menuItemMap.get(item.menuItemId)!;
      if (mi.stockTrackingEnabled) {
        const newQty = Math.max(0, (mi.stockQuantity ?? 0) - item.quantity);
        await tx.menuItem.update({
          where: { id: mi.id },
          data: { stockQuantity: newQty, isAvailable: newQty > 0 },
        });
      }
    }

    if (promoCodeId) await tx.promoCode.update({ where: { id: promoCodeId }, data: { usedCount: { increment: 1 } } });

    return tx.order.create({
      data: {
        restaurantId, branchId,
        customerId,
        orderNumber,
        orderType,
        orderSource: "ONLINE",
        customerName,
        customerPhone,
        deliveryAddress: deliveryAddress || null,
        notes: notes || null,
        subtotal,
        total,
        discountAmount,
        discountCode: discountCodeSnapshot,
        promoCodeId,
        orderItems: {
          create: orderItemsData.map((i) => ({
            menuItemId: i.menuItemId,
            nameSnapshot: i.nameSnapshot,
            unitPrice: i.unitPrice,
            quantity: i.quantity,
            totalPrice: i.totalPrice,
            orderItemOptions: {
              create: i.selectedOptions.map((o) => ({
                optionId: o.optionId,
                nameSnapshot: o.nameSnapshot,
                extraPrice: o.extraPrice,
              })),
            },
          })),
        },
      },
    });
  });

  await fireNotification({
    restaurantId,
    event: "ORDER_CREATED",
    recipient: customerPhone,
    data: { orderNumber, orderType },
  });

  return NextResponse.json({ id: order.id, orderNumber: order.orderNumber, orderType: order.orderType }, { status: 201 });
}
