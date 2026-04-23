import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  restaurantId: z.string().min(1),
  customerName: z.string().min(1).max(200),
  phone: z.string().min(1).max(50),
  reservationDate: z.string().min(1),
  guestCount: z.number().int().positive(),
  notes: z.string().max(500).optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const reservations = await prisma.reservation.findMany({
    where: {
      restaurantId: session.user.restaurantId,
      ...(status ? { status: status as never } : {}),
    },
    orderBy: { reservationDate: "asc" },
    take: 100,
  });

  return NextResponse.json(reservations);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { restaurantId, customerName, phone, reservationDate, guestCount, notes } = parsed.data;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId, status: "ACTIVE" },
  });
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  const reservation = await prisma.reservation.create({
    data: {
      restaurantId,
      customerName,
      phone,
      reservationDate: new Date(reservationDate),
      guestCount,
      notes: notes || null,
    },
  });

  return NextResponse.json(reservation, { status: 201 });
}
