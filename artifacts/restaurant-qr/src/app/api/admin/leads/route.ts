import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const check = await requirePlatformAdmin(req);
  if (check) return check;

  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(leads);
}

export async function PATCH(req: NextRequest) {
  const check = await requirePlatformAdmin(req);
  if (check) return check;

  const { id, isRead } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const lead = await prisma.lead.update({
    where: { id },
    data: { isRead },
  });

  return NextResponse.json(lead);
}
