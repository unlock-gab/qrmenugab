import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const orders = await prisma.order.findMany({
    where: { tableId: id, restaurantId: session.user.restaurantId, status: { in: ["NEW", "PREPARING", "READY", "SERVED"] } },
    include: {
      orderItems: { select: { id: true, nameSnapshot: true, quantity: true, unitPrice: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders.map((o) => ({
    id: o.id, orderNumber: o.orderNumber, status: o.status,
    paymentStatus: o.paymentStatus, total: o.total.toNumber(),
    notes: o.notes, createdAt: o.createdAt.toISOString(),
    orderItems: o.orderItems.map((i) => ({
      id: i.id, nameSnapshot: i.nameSnapshot, quantity: i.quantity, unitPrice: i.unitPrice.toNumber(),
    })),
  })));
}
