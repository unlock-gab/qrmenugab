import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true, isPublic: true },
      orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        displayPrice: true,
        billingInterval: true,
        maxTables: true,
        maxMenuItems: true,
        maxStaffUsers: true,
        featuresJson: true,
        isFeatured: true,
        sortOrder: true,
      },
    });
    return NextResponse.json(plans);
  } catch (error) {
    console.error("Public plans error:", error);
    return NextResponse.json({ error: "Failed to load plans" }, { status: 500 });
  }
}
