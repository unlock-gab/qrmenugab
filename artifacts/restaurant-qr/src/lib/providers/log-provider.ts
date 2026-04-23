import type { NotificationProvider, MessagePayload } from "./types";

/**
 * LogProvider — development mock.
 * Logs the message to console only, returns success.
 * Replace with real providers (Twilio SMS/WhatsApp, Nodemailer, etc.) per channel.
 */
export class LogProvider implements NotificationProvider {
  name = "log";
  channel: "EMAIL" | "SMS" | "WHATSAPP" | "PUSH";

  constructor(channel: "EMAIL" | "SMS" | "WHATSAPP" | "PUSH" = "EMAIL") {
    this.channel = channel;
  }

  async send(payload: MessagePayload) {
    console.log(`[Notification:${this.channel}] → ${payload.to}: ${payload.body}`);
    return { success: true, providerRef: `log-${Date.now()}` };
  }
}
