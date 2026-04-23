export type ProviderChannel = "EMAIL" | "SMS" | "WHATSAPP" | "PUSH";

export interface MessagePayload {
  to: string;
  subject?: string;
  body: string;
  locale?: "fr" | "ar";
}

export interface NotificationProvider {
  name: string;
  channel: ProviderChannel;
  send(payload: MessagePayload): Promise<{ success: boolean; providerRef?: string; error?: string }>;
}
