import type { NotificationProvider, MessagePayload } from "./types";

/**
 * TwilioProvider — placeholder for Twilio SMS / WhatsApp integration.
 *
 * To activate:
 * 1. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER in .env
 * 2. Install: pnpm --filter @workspace/restaurant-qr add twilio
 * 3. Uncomment the implementation below and remove the mock.
 *
 * See .env.example for required environment variables.
 */
export class TwilioSmsProvider implements NotificationProvider {
  name = "twilio-sms";
  channel: "SMS" = "SMS";

  async send(payload: MessagePayload) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM_NUMBER;

    if (!sid || !token || !from) {
      console.warn("[TwilioSMS] Provider not configured — skipping.");
      return { success: false, error: "Provider not configured" };
    }

    // Uncomment when twilio package installed:
    // const twilio = (await import("twilio")).default;
    // const client = twilio(sid, token);
    // const msg = await client.messages.create({ to: payload.to, from, body: payload.body });
    // return { success: true, providerRef: msg.sid };

    console.log(`[TwilioSMS] Would send to ${payload.to}: ${payload.body}`);
    return { success: true, providerRef: `mock-${Date.now()}` };
  }
}

export class TwilioWhatsAppProvider implements NotificationProvider {
  name = "twilio-whatsapp";
  channel: "WHATSAPP" = "WHATSAPP";

  async send(payload: MessagePayload) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

    if (!sid || !token) {
      console.warn("[TwilioWhatsApp] Provider not configured — skipping.");
      return { success: false, error: "Provider not configured" };
    }

    const to = payload.to.startsWith("whatsapp:") ? payload.to : `whatsapp:${payload.to}`;

    // Uncomment when twilio package installed:
    // const twilio = (await import("twilio")).default;
    // const client = twilio(sid, token);
    // const msg = await client.messages.create({ to, from, body: payload.body });
    // return { success: true, providerRef: msg.sid };

    console.log(`[TwilioWhatsApp] Would send to ${to}: ${payload.body}`);
    return { success: true, providerRef: `mock-wa-${Date.now()}` };
  }
}
