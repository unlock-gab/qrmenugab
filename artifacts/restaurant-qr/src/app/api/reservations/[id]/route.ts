import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { status } = await req.json();

  const validStatuses = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const reservation = await prisma.reservation.findFirst({
    where: { id, restaurantId: session.user.restaurantId },
  });
  if (!reservation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.reservation.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const reservation = await prisma.reservation.findFirst({
    where: { id, restaurantId: session.user.restaurantId },
  });
  if (!reservation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.reservation.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
