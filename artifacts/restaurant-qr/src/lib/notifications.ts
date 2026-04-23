import prisma from "@/lib/prisma";

export type NotificationEvent =
  | "ORDER_CREATED"
  | "ORDER_READY"
  | "ORDER_PAID"
  | "RESERVATION_CONFIRMED"
  | "WAITER_REQUEST_HANDLED";

interface NotificationPayload {
  restaurantId: string;
  event: NotificationEvent;
  recipient?: string;
  data?: Record<string, unknown>;
}

function buildBody(event: NotificationEvent, data: Record<string, unknown> = {}): string {
  switch (event) {
    case "ORDER_CREATED": return `طلب جديد #${data.orderNumber || ""} — ${data.orderType || "دine-in"}`;
    case "ORDER_READY": return `طلبك #${data.orderNumber || ""} جاهز! 🎉`;
    case "ORDER_PAID": return `تم الدفع لطلب #${data.orderNumber || ""} — شكراً!`;
    case "RESERVATION_CONFIRMED": return `تأكيد الحجز لـ ${data.customerName || ""} — ${data.reservationDate || ""}`;
    case "WAITER_REQUEST_HANDLED": return `تمت معالجة طلب النادل`;
    default: return event;
  }
}

export async function fireNotification(payload: NotificationPayload): Promise<void> {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: payload.restaurantId },
      select: { notificationsEnabled: true, notifyChannels: true, notifyOnNewOrder: true, notifyOnOrderReady: true },
    });

    if (!restaurant?.notificationsEnabled) return;

    const channels: string[] = restaurant.notifyChannels
      ? JSON.parse(restaurant.notifyChannels)
      : ["EMAIL"];

    const body = buildBody(payload.event, payload.data || {});

    // Log notification (actual sends wired to providers in future)
    for (const channel of channels) {
      await prisma.notificationLog.create({
        data: {
          restaurantId: payload.restaurantId,
          channel: channel as "EMAIL" | "SMS" | "WHATSAPP" | "PUSH",
          status: "PENDING",
          eventType: payload.event,
          recipient: payload.recipient || "restaurant",
          body,
          sentAt: null,
        },
      });
    }

    // TODO: Wire actual provider sends here (Twilio, WhatsApp, email, etc.)
    // Example: await twilioClient.messages.create({ to: recipient, body })
    // After sending, update log status to SENT

    // For now, mark as SKIPPED (no provider configured)
    await prisma.notificationLog.updateMany({
      where: { restaurantId: payload.restaurantId, status: "PENDING" },
      data: { status: "SKIPPED", sentAt: new Date() },
    });
  } catch (err) {
    console.error("[Notifications] Failed to fire notification:", err);
  }
}
