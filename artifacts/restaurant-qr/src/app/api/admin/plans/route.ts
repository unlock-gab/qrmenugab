import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/permissions";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    await requirePlatformAdmin();
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { subscriptions: true } } },
    });
    return NextResponse.json(plans);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePlatformAdmin();
    const body = await req.json();
    const { name, description, price, maxTables, maxMenuItems, maxStaffUsers } = body;

    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        description,
        price: price ? parseFloat(price) : null,
        maxTables: maxTables || 10,
        maxMenuItems: maxMenuItems || 50,
        maxStaffUsers: maxStaffUsers || 3,
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create plan" }, { status: 500 });
  }
}
