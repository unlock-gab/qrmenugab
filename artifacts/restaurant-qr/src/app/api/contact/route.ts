import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(1).max(100),
  restaurantName: z.string().max(100).optional(),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  city: z.string().max(80).optional(),
  message: z.string().min(1).max(2000),
  source: z.string().optional().default("contact_form"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const lead = await prisma.lead.create({
      data: {
        name: data.name,
        restaurantName: data.restaurantName,
        email: data.email,
        phone: data.phone,
        city: data.city,
        message: data.message,
        source: data.source,
      },
    });

    return NextResponse.json({ success: true, id: lead.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }
    console.error("Contact form error:", error);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}
