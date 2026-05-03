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
  const requests = await prisma.waiterRequest.findMany({
    where: { tableId: id, restaurantId: session.user.restaurantId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(requests.map((r) => ({
    id: r.id, type: r.type, status: r.status,
    notes: r.notes, createdAt: r.createdAt.toISOString(),
  })));
}
