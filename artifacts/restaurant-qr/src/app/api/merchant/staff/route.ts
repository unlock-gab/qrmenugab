import { NextRequest, NextResponse } from "next/server";
import { requireMerchantOwner } from "@/lib/permissions";
import { checkStaffLimit } from "@/lib/limits";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const session = await requireMerchantOwner();
    const restaurantId = session.user.restaurantId;
    if (!restaurantId) return NextResponse.json({ error: "No restaurant" }, { status: 400 });

    const staff = await prisma.user.findMany({
      where: { restaurantId, role: "MERCHANT_STAFF" },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });

    return NextResponse.json(staff);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireMerchantOwner();
    const restaurantId = session.user.restaurantId;
    if (!restaurantId) return NextResponse.json({ error: "No restaurant" }, { status: 400 });

    const limit = await checkStaffLimit(restaurantId);
    if (!limit.allowed) {
      return NextResponse.json({
        error: `Staff limit reached (${limit.current}/${limit.max}). Upgrade your plan to add more staff.`,
        limitReached: true,
      }, { status: 403 });
    }

    const { name, email, password } = await req.json();
    if (!name || !email || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

    const passwordHash = await bcrypt.hash(password, 10);
    const staff = await prisma.user.create({
      data: { name, email, passwordHash, role: "MERCHANT_STAFF", restaurantId, isActive: true },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });

    return NextResponse.json(staff, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create staff" }, { status: 500 });
  }
}
