import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/permissions";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    await requirePlatformAdmin();
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "100"));
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: role ? { role: role as "PLATFORM_ADMIN" | "MERCHANT_OWNER" | "MERCHANT_STAFF" } : undefined,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          restaurant: { select: { id: true, name: true, slug: true, status: true } },
        },
      }),
      prisma.user.count({
        where: role ? { role: role as "PLATFORM_ADMIN" | "MERCHANT_OWNER" | "MERCHANT_STAFF" } : undefined,
      }),
    ]);

    return NextResponse.json(users, {
      headers: { "X-Total-Count": total.toString() },
    });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
