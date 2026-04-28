import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const urlOrEmpty = z
  .string()
  .url()
  .or(z.literal(""))
  .or(z.string().startsWith("/uploads/"))
  .or(z.string().startsWith("/api/files/"))
  .nullable()
  .optional();

const updateSettingsSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  logoUrl: urlOrEmpty,
  coverImageUrl: urlOrEmpty,
  currency: z.string().length(3).optional(),
  soundEnabled: z.boolean().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: session.user.restaurantId },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      phone: true,
      address: true,
      logoUrl: true,
      coverImageUrl: true,
      currency: true,
      soundEnabled: true,
    },
  });

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  return NextResponse.json(restaurant);
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.restaurantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updateSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.address !== undefined) updateData.address = data.address || null;
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl || null;
    if (data.coverImageUrl !== undefined) updateData.coverImageUrl = data.coverImageUrl || null;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.soundEnabled !== undefined) updateData.soundEnabled = data.soundEnabled;

    // Auto-activate restaurant when settings are saved for the first time
    const current = await prisma.restaurant.findUnique({
      where: { id: session.user.restaurantId },
      select: { status: true, isPublic: true },
    });
    if (current?.status === "PENDING_SETUP") {
      updateData.status = "ACTIVE";
      updateData.onboardingCompleted = true;
      updateData.isPublic = true;
    }

    const restaurant = await prisma.restaurant.update({
      where: { id: session.user.restaurantId },
      data: updateData,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        phone: true,
        address: true,
        logoUrl: true,
        coverImageUrl: true,
        currency: true,
        soundEnabled: true,
      },
    });

    return NextResponse.json(restaurant);
  } catch (err) {
    console.error("[settings PATCH]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
