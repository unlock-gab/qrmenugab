import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const demoSchema = z.object({
  name: z.string().min(1).max(100),
  restaurantName: z.string().max(100).optional().default(""),
  email: z.string().email(),
  phone: z.string().min(1).max(30),
  city: z.string().max(100).optional().default(""),
  businessType: z.string().max(100).optional().default(""),
  message: z.string().max(1000).optional().default(""),
  source: z.string().max(50).optional().default("demo_page"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = demoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const { name, restaurantName, email, phone, city, businessType, message, source } = parsed.data;

    await prisma.lead.create({
      data: {
        name,
        restaurantName: restaurantName || null,
        email,
        phone: phone || null,
        city: city || null,
        businessType: businessType || null,
        message: message || null,
        source: source || "demo_page",
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[demo POST]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
