"use client";

import { useEffect, useState, useCallback } from "react";

interface OrderItem {
  id: string;
  nameSnapshot: string;
  quantity: number;
  menuItem?: { name: string };
}

interface Order {
  id: string;
  orderNumber: string;
  status: "NEW" | "PREPARING" | "READY";
  orderSource: string;
  notes?: string | null;
  createdAt: string;
  table: { tableNumber: string };
  orderItems: OrderItem[];
}

const STATUS_CONFIG = {
  NEW: { label: "جديد", color: "bg-red-500", ring: "ring-red-400", text: "text-red-100" },
  PREPARING: { label: "يُحضَّر", color: "bg-amber-500", ring: "ring-amber-400", text: "text-amber-100" },
  READY: { label: "جاهز ✓", color: "bg-emerald-500", ring: "ring-emerald-400", text: "text-emerald-100" },
};

function OrderAge({ createdAt }: { createdAt: string }) {
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const i = setInterval(() => forceUpdate((n) => n + 1), 30000);
    return () => clearInterval(i);
  }, []);
  const secs = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
  const mins = Math.floor(secs / 60);
  const color = mins >= 15 ? "text-red-400" : mins >= 8 ? "text-amber-400" : "text-gray-400";
  return (
    <span className={`text-sm font-mono ${color}`}>
      {mins < 1 ? "الآن" : `${mins} د`}
    </span>
  );
}

function KDSCard({ order, onAction }: { order: Order; onAction: (id: string, status: string) => void }) {
  const isNew = order.status === "NEW";
  const isPreparing = order.status === "PREPARING";
  const cfg = STATUS_CONFIG[order.status];

  return (
    <div
      className={`relative bg-gray-800 rounded-2xl ring-2 ${cfg.ring} shadow-xl flex flex-col gap-3 p-5 transition-all duration-300 ${isNew ? "animate-pulse-once" : ""}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${cfg.color} text-white`}>
            {cfg.label}
          </span>
          {order.orderSource === "MANUAL" && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-blue-700 text-blue-100">يدوي</span>
          )}
        </div>
        <OrderAge createdAt={order.createdAt} />
      </div>

      <div className="flex items-baseline gap-3">
        <h2 className="text-3xl font-black text-white">#{order.orderNumber}</h2>
        <span className="text-2xl font-bold text-gray-300">طاولة {order.table.tableNumber}</span>
      </div>

      <ul className="space-y-1.5 border-t border-gray-700 pt-3">
        {order.orderItems.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-lg font-black text-white flex-shrink-0">
              {item.quantity}
            </span>
            <span className="text-white text-base font-medium">{item.nameSnapshot}</span>
          </li>
        ))}
      </ul>

      {order.notes && (
        <div className="bg-amber-900/40 border border-amber-700/50 rounded-lg px-3 py-2 text-amber-200 text-sm">
          📝 {order.notes}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        {isNew && (
          <button
            onClick={() => onAction(order.id, "PREPARING")}
            className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-base transition-colors"
          >
            ابدأ التحضير
          </button>
        )}
        {isPreparing && (
          <button
            onClick={() => onAction(order.id, "READY")}
            className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-base transition-colors"
          >
            جاهز للتقديم ✓
          </button>
        )}
        {order.status === "READY" && (
          <div className="flex-1 py-3 rounded-xl bg-emerald-800/50 text-emerald-300 font-bold text-base text-center">
            في انتظار النادل
          </div>
        )}
      </div>
    </div>
  );
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<"ALL" | "NEW" | "PREPARING" | "READY">("ALL");
  const [loading, setLoading] = useState(true);
  const [lastCount, setLastCount] = useState(0);

  const playBeep = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/kitchen", { cache: "no-store" });
      if (!res.ok) return;
      const data: Order[] = await res.json();
      setOrders(data);
      const newCount = data.filter((o) => o.status === "NEW").length;
      if (newCount > lastCount && lastCount >= 0) playBeep();
      setLastCount(newCount);
    } catch {}
    finally { setLoading(false); }
  }, [lastCount, playBeep]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 8000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleAction = async (orderId: string, status: string) => {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) fetchOrders();
  };

  const filtered = filter === "ALL" ? orders : orders.filter((o) => o.status === filter);
  const counts = {
    NEW: orders.filter((o) => o.status === "NEW").length,
    PREPARING: orders.filter((o) => o.status === "PREPARING").length,
    READY: orders.filter((o) => o.status === "READY").length,
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-2xl font-black text-white">شاشة المطبخ</h1>
          </div>
          <div className="flex gap-2">
            {(["ALL", "NEW", "PREPARING", "READY"] as const).map((f) => {
              const label = f === "ALL" ? `الكل (${orders.length})` : f === "NEW" ? `جديد (${counts.NEW})` : f === "PREPARING" ? `يُحضَّر (${counts.PREPARING})` : `جاهز (${counts.READY})`;
              const active = f === filter;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${active ? "bg-white text-gray-900" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-20 text-lg">جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-500 py-20">
            <div className="text-6xl mb-4">🍳</div>
            <p className="text-xl font-medium">لا توجد طلبات نشطة</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((order) => (
              <KDSCard key={order.id} order={order} onAction={handleAction} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
