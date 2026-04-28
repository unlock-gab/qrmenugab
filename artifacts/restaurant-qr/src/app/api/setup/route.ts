import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function runSetup() {
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
    results.push("✅ Plans d'abonnement créés");
  } catch (e: any) {
    results.push("❌ Plans: " + e.message);
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
    results.push("✅ Admin créé: admin@platform.com / admin123");
  } catch (e: any) {
    results.push("❌ Admin: " + e.message);
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
    results.push("✅ Demo: demo@restaurant.com / demo123");
  } catch (e: any) {
    results.push("❌ Demo: " + e.message);
  }

  return results;
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const expected = process.env.SETUP_TOKEN || "qrmenu-setup-2026";

  if (token !== expected) {
    return new Response(
      `<html><body style="font-family:sans-serif;padding:2rem">
        <h2>🔐 Setup QRMenu</h2>
        <p>Ajoutez <code>?token=qrmenu-setup-2026</code> à l'URL pour lancer le setup.</p>
      </body></html>`,
      { status: 401, headers: { "Content-Type": "text/html" } }
    );
  }

  const results = await runSetup();

  const html = `<html><body style="font-family:sans-serif;padding:2rem;max-width:600px">
    <h2>✅ Setup QRMenu terminé</h2>
    <ul>${results.map((r) => `<li style="margin:8px 0;font-size:1.1rem">${r}</li>`).join("")}</ul>
    <hr>
    <p><strong>Admin:</strong> <a href="/admin/login">ai.gab-digital.com/admin/login</a></p>
    <p>Email: <code>admin@platform.com</code> — Mot de passe: <code>admin123</code></p>
  </body></html>`;

  return new Response(html, { status: 200, headers: { "Content-Type": "text/html" } });
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-setup-token") || req.nextUrl.searchParams.get("token");
  const expected = process.env.SETUP_TOKEN || "qrmenu-setup-2026";
  if (token !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const results = await runSetup();
  return NextResponse.json({ ok: true, results });
}
