import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const channel = searchParams.get("channel");
  const limit = Math.min(Number(searchParams.get("limit") || "50"), 200);

  const logs = await prisma.notificationLog.findMany({
    where: {
      restaurantId: session.user.restaurantId,
      ...(status ? { status: status as "PENDING" | "SENT" | "FAILED" | "SKIPPED" } : {}),
      ...(channel ? { channel: channel as "EMAIL" | "SMS" | "WHATSAPP" | "PUSH" } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json(logs.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
    sentAt: l.sentAt?.toISOString() ?? null,
  })));
}
