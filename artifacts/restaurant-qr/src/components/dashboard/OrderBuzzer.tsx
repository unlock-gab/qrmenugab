"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";

interface NewOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  table?: { tableNumber: string } | null;
  orderItems: { menuItem: { name: string }; quantity: number }[];
}

interface Toast {
  id: string;
  orders: NewOrder[];
}

/** Plays a restaurant-style 3-ding sound using Web Audio API (no file needed). */
function playDing() {
  try {
    const ctx = new (window.AudioContext || (window as never as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const notes = [880, 1100, 1320]; // A5 → C#6 → E6 ascending ding
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.4, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
      osc.start(start);
      osc.stop(start + 0.55);
    });
  } catch {}
}

const POLL_INTERVAL = 10_000; // 10 seconds
const STORAGE_KEY = "qrmenu_last_order_check";

export function OrderBuzzer() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initRef = useRef(false);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const poll = useCallback(async () => {
    try {
      const since = localStorage.getItem(STORAGE_KEY) || new Date(Date.now() - 60_000).toISOString();
      const res = await fetch(`/api/orders?status=NEW&since=${encodeURIComponent(since)}`, {
        cache: "no-store",
      });
      if (!res.ok) return;

      const orders: NewOrder[] = await res.json();

      // Update the since timestamp to now
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());

      // Find genuinely new orders (not yet seen in this session)
      const newOrders = orders.filter((o) => !seenIdsRef.current.has(o.id));
      newOrders.forEach((o) => seenIdsRef.current.add(o.id));

      // On the very first poll, just seed the seen set — don't alarm for old orders
      if (!initRef.current) {
        initRef.current = true;
        return;
      }

      if (newOrders.length > 0) {
        playDing();
        const toast: Toast = {
          id: `${Date.now()}`,
          orders: newOrders,
        };
        setToasts((prev) => [...prev.slice(-3), toast]); // keep max 4 toasts
        // Auto-dismiss after 12 seconds
        setTimeout(() => dismissToast(toast.id), 12_000);
      }
    } catch {}
  }, []);

  useEffect(() => {
    // Reset since timestamp on mount so we look at the last minute only
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, new Date(Date.now() - 60_000).toISOString());
    }
    poll();
    const interval = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [poll]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 bg-gray-900 text-white rounded-2xl shadow-2xl px-4 py-3 max-w-sm w-full border border-violet-500/40 animate-in slide-in-from-bottom-4"
          style={{ animation: "slideUp 0.3s ease-out" }}
        >
          {/* Bell icon pulsing */}
          <div className="mt-0.5 shrink-0 text-2xl animate-bounce">🔔</div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white leading-tight">
              {toast.orders.length === 1
                ? "Nouvelle commande !"
                : `${toast.orders.length} nouvelles commandes !`}
            </p>
            {toast.orders.map((order) => (
              <p key={order.id} className="text-xs text-gray-300 mt-0.5 truncate">
                #{order.orderNumber}
                {order.table ? ` · Table ${order.table.tableNumber}` : ""}
                {" · "}
                {order.orderItems.slice(0, 2).map((i) => `${i.quantity}× ${i.menuItem.name}`).join(", ")}
                {order.orderItems.length > 2 ? ` +${order.orderItems.length - 2}` : ""}
              </p>
            ))}
            <Link
              href="/merchant/orders"
              className="inline-block mt-2 text-xs font-semibold text-violet-400 hover:text-violet-300 transition"
              onClick={() => dismissToast(toast.id)}
            >
              Voir les commandes →
            </Link>
          </div>

          <button
            onClick={() => dismissToast(toast.id)}
            className="shrink-0 text-gray-500 hover:text-gray-300 transition text-lg leading-none mt-0.5"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
      ))}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
