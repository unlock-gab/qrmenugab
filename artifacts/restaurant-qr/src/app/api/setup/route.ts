import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-setup-token") || req.nextUrl.searchParams.get("token");
  const expected = process.env.SETUP_TOKEN || "qrmenu-setup-2026";

  if (token !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: string[] = [];

  try {
    await prisma.subscriptionPlan.upsert({
      where: { id: "plan_starter" },
      update: { isPublic: true, isFeatured: false, sortOrder: 1 },
      create: {
        id: "plan_starter", name: "Starter",
        description: "Parfait pour les petits restaurants et cafés",
        price: 2900, displayPrice: "2 900 DA", billingInterval: "month",
        maxTables: 10, maxMenuItems: 50, maxStaffUsers: 2,
        isActive: true, isPublic: true, isFeatured: false, sortOrder: 1,
      },
    });
    await prisma.subscriptionPlan.upsert({
      where: { id: "plan_growth" },
      update: { isPublic: true, isFeatured: true, sortOrder: 2 },
      create: {
        id: "plan_growth", name: "Growth",
        description: "Pour les restaurants en croissance",
        price: 6900, displayPrice: "6 900 DA", billingInterval: "month",
        maxTables: 30, maxMenuItems: 150, maxStaffUsers: 5,
        isActive: true, isPublic: true, isFeatured: true, sortOrder: 2,
      },
    });
    await prisma.subscriptionPlan.upsert({
      where: { id: "plan_pro" },
      update: { isPublic: true, isFeatured: false, sortOrder: 3 },
      create: {
        id: "plan_pro", name: "Professional",
        description: "Toutes les fonctionnalités pour les grands établissements",
        price: 14900, displayPrice: "14 900 DA", billingInterval: "month",
        maxTables: 100, maxMenuItems: 500, maxStaffUsers: 20,
        isActive: true, isPublic: true, isFeatured: false, sortOrder: 3,
      },
    });
    results.push("✅ Subscription plans created/updated");
  } catch (e: any) {
    results.push("❌ Plans error: " + e.message);
  }

  try {
    const hash = await bcrypt.hash("admin123", 10);
    await prisma.user.upsert({
      where: { email: "admin@platform.com" },
      update: {},
      create: {
        name: "Platform Admin",
        email: "admin@platform.com",
        passwordHash: hash,
        role: "PLATFORM_ADMIN",
        isActive: true,
      },
    });
    results.push("✅ Admin user created (admin@platform.com / admin123)");
  } catch (e: any) {
    results.push("❌ Admin user error: " + e.message);
  }

  try {
    const demoHash = await bcrypt.hash("demo123", 10);
    const demoRestaurant = await prisma.restaurant.upsert({
      where: { slug: "demo-bistro" },
      update: { status: "ACTIVE", onboardingCompleted: true },
      create: {
        name: "Demo Bistro", slug: "demo-bistro",
        status: "ACTIVE", onboardingCompleted: true, primaryColor: "#f97316",
      },
    });
    await prisma.user.upsert({
      where: { email: "demo@restaurant.com" },
      update: { restaurantId: demoRestaurant.id },
      create: {
        name: "Demo Owner", email: "demo@restaurant.com",
        passwordHash: demoHash, role: "MERCHANT_OWNER",
        isActive: true, restaurantId: demoRestaurant.id,
      },
    });
    results.push("✅ Demo restaurant & merchant created (demo@restaurant.com / demo123)");
  } catch (e: any) {
    results.push("❌ Demo data error: " + e.message);
  }

  return NextResponse.json({ ok: true, results });
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const expected = process.env.SETUP_TOKEN || "qrmenu-setup-2026";
  if (token !== expected) {
    return NextResponse.json({ error: "Unauthorized. Add ?token=your-setup-token" }, { status: 401 });
  }
  try {
    await prisma.$queryRaw`SELECT 1`;
    const plans = await prisma.subscriptionPlan.count();
    const users = await prisma.user.count();
    return NextResponse.json({ db: "connected", plans, users });
  } catch (e: any) {
    return NextResponse.json({ db: "error", error: e.message }, { status: 500 });
  }
}
