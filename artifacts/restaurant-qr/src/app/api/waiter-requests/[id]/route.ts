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

  if (!["PENDING", "HANDLED"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const request = await prisma.waiterRequest.findFirst({
    where: { id, restaurantId: session.user.restaurantId },
  });
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.waiterRequest.update({
    where: { id },
    data: {
      status,
      handledAt: status === "HANDLED" ? new Date() : null,
    },
  });

  return NextResponse.json(updated);
}
