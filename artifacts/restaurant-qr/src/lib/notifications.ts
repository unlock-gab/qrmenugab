import prisma from "@/lib/prisma";
import { LogProvider } from "@/lib/providers/log-provider";
import type { NotificationProvider } from "@/lib/providers/types";

export type NotificationEvent =
  | "ORDER_CREATED"
  | "ORDER_READY"
  | "ORDER_PAID"
  | "RESERVATION_CONFIRMED"
  | "WAITER_REQUEST_HANDLED"
  | "LOW_STOCK"
  | "SUBSCRIPTION_EXPIRING";

interface NotificationPayload {
  restaurantId: string;
  event: NotificationEvent;
  recipient?: string;
  locale?: "fr" | "ar";
  data?: Record<string, unknown>;
}

// ── Message templates (FR primary, AR secondary) ─────────────────────────────

type LocaleMessages = { fr: string; ar: string };
type TemplateMap = Record<NotificationEvent, (data: Record<string, unknown>) => LocaleMessages>;

const TEMPLATES: TemplateMap = {
  ORDER_CREATED: (d) => ({
    fr: `🆕 Nouvelle commande #${d.orderNumber || "?"} — ${d.orderType === "DELIVERY" ? "Livraison" : d.orderType === "TAKEAWAY" ? "À emporter" : "Sur place"}`,
    ar: `🆕 طلب جديد #${d.orderNumber || "?"} — ${d.orderType === "DELIVERY" ? "توصيل" : d.orderType === "TAKEAWAY" ? "استلام" : "داخلي"}`,
  }),
  ORDER_READY: (d) => ({
    fr: `✅ Commande #${d.orderNumber || "?"} prête — Veuillez passer en caisse`,
    ar: `✅ طلب #${d.orderNumber || "?"} جاهز — يرجى التوجه للكاشير`,
  }),
  ORDER_PAID: (d) => ({
    fr: `💳 Commande #${d.orderNumber || "?"} réglée — Merci !`,
    ar: `💳 تم دفع طلب #${d.orderNumber || "?"} — شكراً!`,
  }),
  RESERVATION_CONFIRMED: (d) => ({
    fr: `📅 Réservation confirmée — ${d.customerName || ""} le ${d.reservationDate || ""}`,
    ar: `📅 تم تأكيد الحجز — ${d.customerName || ""} بتاريخ ${d.reservationDate || ""}`,
  }),
  WAITER_REQUEST_HANDLED: (d) => ({
    fr: `🙋 Demande de service traitée — Table ${d.tableNumber || "?"}`,
    ar: `🙋 تمت معالجة طلب الخدمة — طاولة ${d.tableNumber || "?"}`,
  }),
  LOW_STOCK: (d) => ({
    fr: `⚠️ Stock faible — ${d.itemName || "Article"} : ${d.stockQuantity || 0} restant(s)`,
    ar: `⚠️ مخزون منخفض — ${d.itemName || "صنف"} : ${d.stockQuantity || 0} متبقٍ`,
  }),
  SUBSCRIPTION_EXPIRING: (d) => ({
    fr: `🔔 Votre abonnement expire dans ${d.daysLeft || "?"} jours — Pensez à renouveler`,
    ar: `🔔 ينتهي اشتراكك خلال ${d.daysLeft || "?"} يوم — يرجى التجديد`,
  }),
};

// ── Provider registry ────────────────────────────────────────────────────────

function getProviders(channels: string[]): Record<string, NotificationProvider> {
  const registry: Record<string, NotificationProvider> = {};
  for (const ch of channels) {
    // In production, swap LogProvider for real providers per channel:
    // EMAIL → NodemailerProvider
    // SMS → TwilioSmsProvider
    // WHATSAPP → TwilioWhatsAppProvider
    registry[ch] = new LogProvider(ch as "EMAIL" | "SMS" | "WHATSAPP" | "PUSH");
  }
  return registry;
}

// ── Main fire function ───────────────────────────────────────────────────────

export async function fireNotification(payload: NotificationPayload): Promise<void> {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: payload.restaurantId },
      select: {
        notificationsEnabled: true,
        notifyChannels: true,
        notifyOnNewOrder: true,
        notifyOnOrderReady: true,
      },
    });

    if (!restaurant?.notificationsEnabled) return;

    const channels: string[] = restaurant.notifyChannels
      ? JSON.parse(restaurant.notifyChannels as string)
      : ["EMAIL"];

    const templateFn = TEMPLATES[payload.event];
    const locale = payload.locale || "fr";
    const messages = templateFn(payload.data || {});
    const body = messages[locale] || messages.fr;

    const providers = getProviders(channels);

    await Promise.allSettled(
      channels.map(async (channel) => {
        let status: "PENDING" | "SENT" | "FAILED" | "SKIPPED" = "PENDING";
        let error: string | undefined;
        let providerRef: string | undefined;

        const log = await prisma.notificationLog.create({
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

        const provider = providers[channel];
        if (provider && payload.recipient) {
          const result = await provider.send({
            to: payload.recipient,
            body,
            locale,
          });
          status = result.success ? "SENT" : "FAILED";
          error = result.error;
          providerRef = result.providerRef;
        } else {
          status = "SKIPPED";
        }

        await prisma.notificationLog.update({
          where: { id: log.id },
          data: {
            status,
            sentAt: status === "SENT" ? new Date() : null,
            error: error || null,
          },
        });
      })
    );
  } catch (err) {
    console.error("[Notifications] Failed:", err);
  }
}

// ── In-app notification helper ────────────────────────────────────────────────

export async function getUnreadNotificationCount(restaurantId: string): Promise<number> {
  return prisma.notificationLog.count({
    where: {
      restaurantId,
      status: { in: ["PENDING", "SENT"] },
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });
}
