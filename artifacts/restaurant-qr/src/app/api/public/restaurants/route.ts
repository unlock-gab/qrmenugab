import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");
    const type = searchParams.get("type");
    const featured = searchParams.get("featured");
    const q = searchParams.get("q");

    const where: Record<string, unknown> = {
      status: "ACTIVE",
      isPublic: true,
    };

    if (city) where.city = { contains: city, mode: "insensitive" };
    if (type) where.restaurantType = type;
    if (featured === "true") where.isFeatured = true;
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { publicDescription: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
      ];
    }

    const restaurants = await prisma.restaurant.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        coverImageUrl: true,
        publicDescription: true,
        city: true,
        restaurantType: true,
        isFeatured: true,
        _count: {
          select: { menuItems: true },
        },
      },
      orderBy: [
        { isFeatured: "desc" },
        { name: "asc" },
      ],
      take: 50,
    });

    return NextResponse.json({ restaurants });
  } catch (error) {
    console.error("[/api/public/restaurants]", error);
    return NextResponse.json({ restaurants: [] });
  }
}
