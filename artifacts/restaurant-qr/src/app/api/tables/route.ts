import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { checkTableLimit } from "@/lib/limits";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

const createTableSchema = z.object({
  tableNumber: z.string().min(1).max(20),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tables = await prisma.table.findMany({
    where: { restaurantId: session.user.restaurantId },
    orderBy: { tableNumber: "asc" },
  });

  return NextResponse.json(tables);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createTableSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const limit = await checkTableLimit(session.user.restaurantId);
  if (!limit.allowed) {
    return NextResponse.json({
      error: `Table limit reached (${limit.current}/${limit.max}). Upgrade your plan to add more tables.`,
      limitReached: true,
    }, { status: 403 });
  }

  const existing = await prisma.table.findFirst({
    where: {
      restaurantId: session.user.restaurantId,
      tableNumber: parsed.data.tableNumber,
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Table number already exists" },
      { status: 400 }
    );
  }

  const table = await prisma.table.create({
    data: {
      restaurantId: session.user.restaurantId,
      tableNumber: parsed.data.tableNumber,
      qrToken: uuidv4(),
    },
  });

  return NextResponse.json(table, { status: 201 });
}
