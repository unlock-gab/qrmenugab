import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MERCHANT_ROLES } from "@/lib/permissions";
import PrintClient from "./PrintClient";

export default async function PrintPage({ params }: { params: Promise<{ orderId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !MERCHANT_ROLES.includes(session.user.role as any)) {
    redirect("/merchant/login");
  }

  const { orderId } = await params;
  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurantId: session.user.restaurantId! },
    include: {
      table: { select: { tableNumber: true } },
      orderItems: {
        include: { orderItemOptions: true },
        orderBy: { createdAt: "asc" },
      },
      restaurant: { select: { name: true, phone: true, address: true, currency: true } },
    },
  });

  if (!order) redirect("/merchant/dashboard");

  const serialized = {
    ...order,
    subtotal: Number(order.subtotal),
    total: Number(order.total),
    discountAmount: Number(order.discountAmount),
    discountCode: order.discountCode ?? null,
    finalTotal: Number(order.total) - Number(order.discountAmount),
    orderItems: order.orderItems.map((i) => ({
      ...i,
      unitPrice: Number(i.unitPrice),
      totalPrice: Number(i.totalPrice),
      orderItemOptions: i.orderItemOptions.map((o) => ({ ...o, extraPrice: Number(o.extraPrice) })),
    })),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    seenAt: order.seenAt?.toISOString() ?? null,
    preparedAt: order.preparedAt?.toISOString() ?? null,
    servedAt: order.servedAt?.toISOString() ?? null,
    paidAt: order.paidAt?.toISOString() ?? null,
  };

  return <PrintClient order={serialized} />;
}
