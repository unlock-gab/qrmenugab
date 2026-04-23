import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const schema = z.object({
  ownerName: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  restaurantName: z.string().min(1).max(100),
  planId: z.string().optional(),
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 50);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const baseSlug = slugify(data.restaurantName) || "restaurant";
    let slug = baseSlug;
    let attempt = 0;
    while (true) {
      const existing = await prisma.restaurant.findUnique({ where: { slug } });
      if (!existing) break;
      attempt++;
      slug = `${baseSlug}-${attempt}`;
    }

    let planId = data.planId;
    if (!planId) {
      const featuredPlan = await prisma.subscriptionPlan.findFirst({
        where: { isActive: true, isFeatured: true },
      });
      if (featuredPlan) planId = featuredPlan.id;
    }

    if (planId) {
      const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
      if (!plan || !plan.isActive) planId = undefined;
    }

    if (!planId) {
      const anyPlan = await prisma.subscriptionPlan.findFirst({ where: { isActive: true }, orderBy: { price: "asc" } });
      if (anyPlan) planId = anyPlan.id;
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const result = await prisma.$transaction(async (tx) => {
      const restaurant = await tx.restaurant.create({
        data: {
          name: data.restaurantName,
          slug,
          status: "PENDING_SETUP",
          onboardingCompleted: false,
        },
      });

      const user = await tx.user.create({
        data: {
          name: data.ownerName,
          email: data.email,
          passwordHash,
          role: "MERCHANT_OWNER",
          restaurantId: restaurant.id,
        },
      });

      if (planId) {
        await tx.restaurantSubscription.create({
          data: {
            restaurantId: restaurant.id,
            planId,
            status: "TRIAL",
            trialEndsAt,
            startDate: new Date(),
          },
        });
      }

      return { restaurant, user };
    });

    return NextResponse.json({ success: true, restaurantId: result.restaurant.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
