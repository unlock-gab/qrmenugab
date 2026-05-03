import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  try {
    await requirePlatformAdmin();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "100"));
    const skip = (page - 1) * limit;

    const [restaurants, total] = await Promise.all([
      prisma.restaurant.findMany({
        where: status ? { status: status as "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_SETUP" } : undefined,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          createdAt: true,
          users: {
            where: { role: "MERCHANT_OWNER" },
            select: { id: true, name: true, email: true },
          },
          subscription: {
            select: { status: true, plan: { select: { name: true } } },
          },
          onboardingCompleted: true,
          onboardingStep: true,
          _count: { select: { tables: true, menuItems: true, orders: true } },
        },
      }),
      prisma.restaurant.count({
        where: status ? { status: status as "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_SETUP" } : undefined,
      }),
    ]);

    return NextResponse.json(restaurants, {
      headers: { "X-Total-Count": total.toString() },
    });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePlatformAdmin();
    const body = await req.json();
    const { restaurantName, slug, ownerName, ownerEmail, ownerPassword, planId, status } = body;

    if (!restaurantName || !slug || !ownerName || !ownerEmail || !ownerPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const slugClean = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const existingSlug = await prisma.restaurant.findUnique({ where: { slug: slugClean } });
    if (existingSlug) return NextResponse.json({ error: "Slug already in use" }, { status: 409 });

    const existingEmail = await prisma.user.findUnique({ where: { email: ownerEmail } });
    if (existingEmail) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

    const passwordHash = await bcrypt.hash(ownerPassword, 10);

    const restaurant = await prisma.restaurant.create({
      data: {
        name: restaurantName,
        slug: slugClean,
        status: status || "PENDING_SETUP",
        onboardingCompleted: false,
        users: {
          create: {
            name: ownerName,
            email: ownerEmail,
            passwordHash,
            role: "MERCHANT_OWNER",
            isActive: true,
          },
        },
        ...(planId && {
          subscription: {
            create: {
              planId,
              status: "TRIAL",
              startDate: new Date(),
              trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      },
      include: {
        users: { select: { id: true, name: true, email: true } },
        subscription: { include: { plan: true } },
      },
    });

    return NextResponse.json(restaurant, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create restaurant" }, { status: 500 });
  }
}
