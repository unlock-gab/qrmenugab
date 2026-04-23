"use client";

import { useState } from "react";
import { toast } from "sonner";

interface NotificationLog {
  id: string; eventType: string; channel: string; status: string;
  recipient: string; body: string; createdAt: string; sentAt: string | null; error: string | null;
}
interface NotificationSettings {
  notificationsEnabled: boolean; notifyOnNewOrder: boolean; notifyOnOrderReady: boolean; notifyChannels: string;
}

const CHANNELS = ["EMAIL", "SMS", "WHATSAPP", "PUSH"];
const CHANNEL_AR: Record<string, string> = { EMAIL: "البريد", SMS: "SMS", WHATSAPP: "واتساب", PUSH: "تنبيه تطبيق" };
const STATUS_COLOR: Record<string, string> = {
  SENT: "bg-green-50 text-green-600", PENDING: "bg-amber-50 text-amber-600",
  FAILED: "bg-red-50 text-red-500", SKIPPED: "bg-gray-100 text-gray-400",
};
const EVENT_AR: Record<string, string> = {
  ORDER_CREATED: "طلب جديد", ORDER_READY: "طلب جاهز", ORDER_PAID: "تم الدفع",
  RESERVATION_CONFIRMED: "تأكيد حجز", WAITER_REQUEST_HANDLED: "طلب نادل",
};

export default function NotificationsClient({ restaurantId, settings: init, initialLogs }: {
  restaurantId: string; settings: NotificationSettings; initialLogs: NotificationLog[];
}) {
  const [settings, setSettings] = useState(init);
  const [channels, setChannels] = useState<string[]>(JSON.parse(init.notifyChannels || "[]"));
  const [logs, setLogs] = useState(initialLogs);
  const [saving, setSaving] = useState(false);

  const toggleChannel = (ch: string) => {
    setChannels((prev) => prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]);
  };

  const saveSettings = async () => {
    setSaving(true);
    const res = await fetch(`/api/restaurants/${restaurantId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notificationsEnabled: settings.notificationsEnabled,
        notifyOnNewOrder: settings.notifyOnNewOrder,
        notifyOnOrderReady: settings.notifyOnOrderReady,
        notifyChannels: JSON.stringify(channels),
      }),
    });
    setSaving(false);
    if (res.ok) toast.success("تم حفظ إعدادات الإشعارات");
    else toast.error("فشل الحفظ");
  };

  const refreshLogs = async () => {
    const r = await fetch("/api/notifications?limit=50");
    if (r.ok) setLogs(await r.json());
  };

  return (
    <div className="flex-1 overflow-y-auto p-6" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">الإشعارات</h1>
          <p className="text-gray-500 text-sm mt-1">إدارة إعدادات وسجل الإشعارات</p>
        </div>

        {/* Settings card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-900">إعدادات الإشعارات</h2>
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <div>
              <p className="font-medium text-gray-700 text-sm">تفعيل الإشعارات</p>
              <p className="text-xs text-gray-400">إرسال إشعارات عند الأحداث المهمة</p>
            </div>
            <button onClick={() => setSettings((s) => ({ ...s, notificationsEnabled: !s.notificationsEnabled }))}
              className={`w-11 h-6 rounded-full transition-all ${settings.notificationsEnabled ? "bg-orange-500" : "bg-gray-200"}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-all mx-0.5 ${settings.notificationsEnabled ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </label>
          <div className={`space-y-3 transition-opacity ${settings.notificationsEnabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <p className="font-medium text-gray-700 text-sm">طلب جديد</p>
                <p className="text-xs text-gray-400">إشعار عند استلام طلب جديد</p>
              </div>
              <button onClick={() => setSettings((s) => ({ ...s, notifyOnNewOrder: !s.notifyOnNewOrder }))}
                className={`w-11 h-6 rounded-full transition-all ${settings.notifyOnNewOrder ? "bg-orange-500" : "bg-gray-200"}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-all mx-0.5 ${settings.notifyOnNewOrder ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </label>
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <p className="font-medium text-gray-700 text-sm">طلب جاهز</p>
                <p className="text-xs text-gray-400">إشعار عند جاهزية الطلب للعميل</p>
              </div>
              <button onClick={() => setSettings((s) => ({ ...s, notifyOnOrderReady: !s.notifyOnOrderReady }))}
                className={`w-11 h-6 rounded-full transition-all ${settings.notifyOnOrderReady ? "bg-orange-500" : "bg-gray-200"}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-all mx-0.5 ${settings.notifyOnOrderReady ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </label>
            <div>
              <p className="font-medium text-gray-700 text-sm mb-2">قنوات الإشعارات</p>
              <div className="flex flex-wrap gap-2">
                {CHANNELS.map((ch) => (
                  <button key={ch} onClick={() => toggleChannel(ch)}
                    className={`px-3 py-1.5 rounded-xl border text-sm font-medium transition ${channels.includes(ch) ? "bg-orange-500 border-orange-500 text-white" : "bg-gray-50 border-gray-200 text-gray-600 hover:border-orange-300"}`}>
                    {CHANNEL_AR[ch]}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">* الإشعارات تُسجَّل حالياً (الإرسال الفعلي يتطلب ربط مزوّد خارجي)</p>
            </div>
          </div>
          <button onClick={saveSettings} disabled={saving}
            className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition disabled:opacity-50">
            {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
          </button>
        </div>

        {/* Logs */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">سجل الإشعارات</h2>
            <button onClick={refreshLogs} className="text-xs text-orange-500 hover:text-orange-600 font-medium">تحديث</button>
          </div>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-2xl mb-2">🔕</p>
              <p className="text-sm">لا توجد إشعارات مسجّلة</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-gray-700">{EVENT_AR[log.eventType] || log.eventType}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[log.status] || "bg-gray-50 text-gray-400"}`}>{log.status}</span>
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{CHANNEL_AR[log.channel] || log.channel}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">{log.body}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(log.createdAt).toLocaleString("ar")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
