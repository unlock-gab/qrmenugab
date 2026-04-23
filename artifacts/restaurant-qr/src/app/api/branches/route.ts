import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const createBranchSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers, hyphens only"),
  address: z.string().max(300).optional(),
  phone: z.string().max(30).optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const branches = await prisma.branch.findMany({
    where: { restaurantId: session.user.restaurantId },
    include: {
      _count: { select: { tables: true, orders: true } },
    },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(branches);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (!["MERCHANT_OWNER", "PLATFORM_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createBranchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Check slug uniqueness
  const existing = await prisma.branch.findUnique({
    where: { restaurantId_slug: { restaurantId: session.user.restaurantId, slug: parsed.data.slug } },
  });
  if (existing) return NextResponse.json({ error: "Branch slug already in use" }, { status: 409 });

  const branch = await prisma.branch.create({
    data: {
      restaurantId: session.user.restaurantId,
      name: parsed.data.name,
      slug: parsed.data.slug,
      address: parsed.data.address || null,
      phone: parsed.data.phone || null,
    },
    include: { _count: { select: { tables: true, orders: true } } },
  });

  return NextResponse.json(branch, { status: 201 });
}
