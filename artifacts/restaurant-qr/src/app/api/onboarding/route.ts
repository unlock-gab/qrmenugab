import { NextRequest, NextResponse } from "next/server";
import { requireMerchantOwner } from "@/lib/permissions";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await requireMerchantOwner();
    const restaurantId = session.user.restaurantId;
    if (!restaurantId) return NextResponse.json({ error: "No restaurant" }, { status: 400 });

    const body = await req.json();
    const { step, data } = body;

    if (step === "restaurant") {
      const { name, description, phone, address } = data;
      await prisma.restaurant.update({
        where: { id: restaurantId },
        data: { name, description, phone, address },
      });
    } else if (step === "tables") {
      const { count } = data;
      const existing = await prisma.table.findMany({ where: { restaurantId }, select: { tableNumber: true } });
      const existingNums = new Set(existing.map((t) => t.tableNumber));
      const toCreate = [];
      for (let i = 1; i <= count; i++) {
        const num = i.toString();
        if (!existingNums.has(num)) toCreate.push({ restaurantId, tableNumber: num });
      }
      if (toCreate.length > 0) {
        await prisma.table.createMany({ data: toCreate });
      }
    } else if (step === "category") {
      const { name } = data;
      await prisma.category.create({ data: { restaurantId, name, sortOrder: 1 } });
    } else if (step === "menuItem") {
      const { categoryId, name, description, price } = data;
      await prisma.menuItem.create({
        data: { restaurantId, categoryId, name, description, price: parseFloat(price), sortOrder: 1 },
      });
    } else if (step === "complete") {
      await prisma.restaurant.update({
        where: { id: restaurantId },
        data: { status: "ACTIVE", onboardingCompleted: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await requireMerchantOwner();
    const restaurantId = session.user.restaurantId;
    if (!restaurantId) return NextResponse.json({ error: "No restaurant" }, { status: 400 });

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        _count: { select: { tables: true, categories: true, menuItems: true } },
      },
    });

    return NextResponse.json(restaurant);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
