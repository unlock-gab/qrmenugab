import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/permissions";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    await requirePlatformAdmin();
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");

    const users = await prisma.user.findMany({
      where: role ? { role: role as "PLATFORM_ADMIN" | "MERCHANT_OWNER" | "MERCHANT_STAFF" } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        restaurant: { select: { id: true, name: true, slug: true, status: true } },
      },
    });

    return NextResponse.json(users.map((u) => ({ ...u, passwordHash: undefined })));
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
