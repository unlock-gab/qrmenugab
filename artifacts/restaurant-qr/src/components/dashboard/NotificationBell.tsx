"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface NotificationItem {
  id: string;
  eventType: string;
  body: string;
  status: string;
  channel: string;
  createdAt: string;
}

interface UnreadData {
  count: number;
  orders: number;
  reservations: number;
  waiterRequests: number;
  recent: NotificationItem[];
}

const EVENT_ICONS: Record<string, string> = {
  ORDER_CREATED: "🆕",
  ORDER_READY: "✅",
  ORDER_PAID: "💳",
  RESERVATION_CONFIRMED: "📅",
  WAITER_REQUEST_HANDLED: "🙋",
  LOW_STOCK: "⚠️",
  SUBSCRIPTION_EXPIRING: "🔔",
};

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Il y a ${hrs}h`;
  return `Il y a ${Math.floor(hrs / 24)}j`;
}

export function NotificationBell() {
  const [data, setData] = useState<UnreadData | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchUnread = async () => {
    try {
      const res = await fetch("/api/notifications/unread", { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } catch {}
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const count = data?.count || 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition"
        aria-label="Notifications"
      >
        <span className="text-lg">🔔</span>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
            {count > 0 && (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">{count} nouveau{count > 1 ? "x" : ""}</span>
            )}
          </div>

          {/* Summary badges */}
          {(data?.orders || data?.reservations || data?.waiterRequests) ? (
            <div className="px-4 py-2 flex gap-2 flex-wrap border-b border-gray-50">
              {(data?.orders || 0) > 0 && (
                <Link href="/orders" onClick={() => setOpen(false)}
                  className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full hover:bg-blue-100 transition font-medium">
                  🆕 {data?.orders} commande{(data?.orders || 0) > 1 ? "s" : ""}
                </Link>
              )}
              {(data?.reservations || 0) > 0 && (
                <Link href="/reservations" onClick={() => setOpen(false)}
                  className="flex items-center gap-1 text-xs bg-purple-50 text-purple-600 px-2.5 py-1 rounded-full hover:bg-purple-100 transition font-medium">
                  📅 {data?.reservations} réserv.
                </Link>
              )}
              {(data?.waiterRequests || 0) > 0 && (
                <Link href="/waiter" onClick={() => setOpen(false)}
                  className="flex items-center gap-1 text-xs bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full hover:bg-amber-100 transition font-medium">
                  🙋 {data?.waiterRequests} service
                </Link>
              )}
            </div>
          ) : null}

          {/* Recent log */}
          <div className="max-h-64 overflow-y-auto">
            {!data?.recent?.length ? (
              <div className="px-4 py-8 text-center text-gray-400 text-sm">
                <p className="text-2xl mb-1">🔔</p>
                Aucune notification récente
              </div>
            ) : (
              data.recent.map((n) => (
                <div key={n.id} className="px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition">
                  <div className="flex items-start gap-2">
                    <span className="shrink-0">{EVENT_ICONS[n.eventType] || "📋"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-800 leading-tight">{n.body}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
            <Link href="/notifications" onClick={() => setOpen(false)}
              className="text-xs text-orange-500 font-medium hover:underline">
              Voir tout le journal →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
