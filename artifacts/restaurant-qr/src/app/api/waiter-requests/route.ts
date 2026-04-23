import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const requests = await prisma.waiterRequest.findMany({
    where: {
      restaurantId: session.user.restaurantId,
      ...(status ? { status: status as "PENDING" | "HANDLED" } : { status: "PENDING" }),
    },
    include: { table: { select: { tableNumber: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(requests);
}

export async function POST(req: NextRequest) {
  const { restaurantId, tableId, type, notes } = await req.json();

  if (!restaurantId || !tableId || !type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const validTypes = ["CALL_WAITER", "REQUEST_BILL", "HELP"];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
  }

  const table = await prisma.table.findFirst({
    where: { id: tableId, restaurantId, isActive: true },
  });
  if (!table) {
    return NextResponse.json({ error: "Table not found" }, { status: 404 });
  }

  const request = await prisma.waiterRequest.create({
    data: {
      restaurantId,
      tableId,
      type,
      notes: notes || null,
    },
    include: { table: { select: { tableNumber: true } } },
  });

  return NextResponse.json(request, { status: 201 });
}
