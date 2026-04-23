"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import { playNotificationSound, unlockAudioContext } from "@/lib/sound";

type OrderItem = {
  id: string;
  nameSnapshot: string;
  quantity: number;
  unitPrice: { toNumber: () => number } | number | string;
  totalPrice: { toNumber: () => number } | number | string;
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  notes: string | null;
  total: { toNumber: () => number } | number | string;
  subtotal: { toNumber: () => number } | number | string;
  createdAt: string | Date;
  seenAt: string | Date | null;
  table: { tableNumber: string } | null;
  orderType?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  deliveryAddress?: string | null;
  orderItems: OrderItem[];
};

const ORDER_TYPE_CONFIG: Record<string, { label: string; badge: string; icon: string }> = {
  DINE_IN: { label: "داخلي", badge: "bg-indigo-50 text-indigo-600 border-indigo-200", icon: "🍽️" },
  TAKEAWAY: { label: "استلام", badge: "bg-amber-50 text-amber-600 border-amber-200", icon: "🥡" },
  DELIVERY: { label: "توصيل", badge: "bg-emerald-50 text-emerald-600 border-emerald-200", icon: "🛵" },
};

const STATUS_FLOW = ["NEW", "PREPARING", "READY", "SERVED", "PAID", "CANCELLED"];

const STATUS_CONFIG: Record<string, { label: string; badge: string; dot: string; card: string }> = {
  NEW: {
    label: "New",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
    card: "border-blue-200 shadow-blue-50",
  },
  PREPARING: {
    label: "Preparing",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    card: "border-amber-100",
  },
  READY: {
    label: "Ready",
    badge: "bg-green-100 text-green-700 border-green-200",
    dot: "bg-green-500",
    card: "border-green-100",
  },
  SERVED: {
    label: "Served",
    badge: "bg-gray-100 text-gray-600 border-gray-200",
    dot: "bg-gray-400",
    card: "border-gray-100",
  },
  PAID: {
    label: "Paid",
    badge: "bg-purple-100 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
    card: "border-gray-100",
  },
  CANCELLED: {
    label: "Cancelled",
    badge: "bg-red-100 text-red-600 border-red-200",
    dot: "bg-red-400",
    card: "border-gray-100",
  },
};

const NEXT_STATUS_LABEL: Record<string, string> = {
  NEW: "Start Preparing",
  PREPARING: "Mark Ready",
  READY: "Mark Served",
  SERVED: "Mark Paid",
};

function getPrice(val: Order["total"]): number {
  return typeof val === "object" && val !== null && "toNumber" in val
    ? val.toNumber()
    : Number(val);
}

function timeAgo(date: string | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

type DetailModalProps = {
  order: Order;
  onClose: () => void;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
  updatingId: string | null;
};

function OrderDetailModal({ order, onClose, onUpdateStatus, updatingId }: DetailModalProps) {
  const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1];
  const canAdvance = nextStatus && nextStatus !== "CANCELLED";

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-500 font-medium">Order Detail</p>
            <h2 className="text-lg font-bold text-gray-900">{order.orderNumber}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition text-lg leading-none"
          >
            ×
          </button>
        </div>

        <div className="overflow-auto flex-1 p-5">
          <div className="flex items-center gap-3 mb-5">
            <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${STATUS_CONFIG[order.status].badge}`}>
              {STATUS_CONFIG[order.status].label}
            </span>
            {order.orderType && ORDER_TYPE_CONFIG[order.orderType] && (
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${ORDER_TYPE_CONFIG[order.orderType].badge}`}>
                {ORDER_TYPE_CONFIG[order.orderType].icon} {ORDER_TYPE_CONFIG[order.orderType].label}
              </span>
            )}
            <span className="text-sm text-gray-500">
              {order.table ? `Table ${order.table.tableNumber}` : order.customerName || "—"} &bull; {timeAgo(order.createdAt)}
            </span>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Items</p>
            {order.orderItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-orange-100 text-orange-600 text-xs font-bold rounded-full flex items-center justify-center shrink-0">
                    {item.quantity}
                  </span>
                  <span className="text-sm text-gray-800 font-medium">{item.nameSnapshot}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatPrice(item.totalPrice)}</p>
                  <p className="text-xs text-gray-400">{formatPrice(item.unitPrice)} ea.</p>
                </div>
              </div>
            ))}
          </div>

          {(order.customerName || order.customerPhone || order.deliveryAddress) && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 space-y-1">
              <p className="text-xs font-semibold text-blue-700 mb-1">
                {order.orderType === "DELIVERY" ? "🛵 معلومات التوصيل" : "🥡 معلومات الاستلام"}
              </p>
              {order.customerName && <p className="text-sm text-blue-900"><strong>الاسم:</strong> {order.customerName}</p>}
              {order.customerPhone && <p className="text-sm text-blue-900"><strong>الهاتف:</strong> {order.customerPhone}</p>}
              {order.deliveryAddress && <p className="text-sm text-blue-900"><strong>العنوان:</strong> {order.deliveryAddress}</p>}
            </div>
          )}

          {order.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4">
              <p className="text-xs font-semibold text-amber-700 mb-1">Note from customer</p>
              <p className="text-sm text-amber-900">{order.notes}</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-xl font-bold text-gray-900">{formatPrice(order.total)}</p>
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 flex gap-2">
          {canAdvance && (
            <button
              onClick={() => onUpdateStatus(order.id, nextStatus)}
              disabled={updatingId === order.id}
              className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50"
            >
              {updatingId === order.id ? "Updating..." : NEXT_STATUS_LABEL[order.status] || `→ ${STATUS_CONFIG[nextStatus]?.label}`}
            </button>
          )}
          {order.status !== "CANCELLED" && order.status !== "PAID" && (
            <button
              onClick={() => onUpdateStatus(order.id, "CANCELLED")}
              disabled={updatingId === order.id}
              className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-xl transition disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

type Props = {
  initialOrders?: Order[];
  soundEnabled?: boolean;
};

export function OrdersClient({ initialOrders = [], soundEnabled = true }: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [filterStatus, setFilterStatus] = useState<string>("ACTIVE");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const seenIds = useRef<Set<string>>(new Set(initialOrders.filter((o) => o.seenAt).map((o) => o.id)));
  const knownIds = useRef<Set<string>>(new Set(initialOrders.map((o) => o.id)));
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const fetchOrders = useCallback(async (quiet = false) => {
    if (!quiet) setIsRefreshing(true);
    const res = await fetch("/api/orders");
    if (!quiet) setIsRefreshing(false);
    if (!res.ok) return;

    const newOrders: Order[] = await res.json();
    const newOrderIds = new Set(newOrders.map((o: Order) => o.id));
    const freshOrders = newOrders.filter((o: Order) => !knownIds.current.has(o.id));

    if (freshOrders.length > 0) {
      knownIds.current = newOrderIds;
      if (soundEnabledRef.current) {
        playNotificationSound();
      }
      toast.info(`🔔 ${freshOrders.length} new order${freshOrders.length > 1 ? "s" : ""} arrived!`, {
        duration: 5000,
      });
    } else {
      knownIds.current = newOrderIds;
    }

    setOrders(newOrders);
  }, []);

  useEffect(() => {
    // Fetch immediately on mount (so page can be thin — no server-side DB query needed)
    fetchOrders(true);
    const handler = () => unlockAudioContext();
    document.addEventListener("click", handler, { once: true });
    const interval = setInterval(() => fetchOrders(true), 8000);
    return () => {
      clearInterval(interval);
      document.removeEventListener("click", handler);
    };
  }, [fetchOrders]);

  const updateStatus = useCallback(async (id: string, status: string) => {
    setUpdatingId(id);
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    setUpdatingId(null);
    if (res.ok) {
      setOrders((prev) => prev.map((o) => (o.id === id ? data : o)));
      setSelectedOrder((prev) => (prev?.id === id ? data : prev));
      toast.success(`Order marked as ${STATUS_CONFIG[status]?.label || status}`);
    } else {
      toast.error("Failed to update order");
    }
  }, []);

  const markSeen = useCallback(async (order: Order) => {
    if (seenIds.current.has(order.id)) return;
    seenIds.current.add(order.id);
    setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, seenAt: new Date().toISOString() } : o));
    await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seenAt: new Date().toISOString() }),
    });
  }, []);

  const openOrder = useCallback((order: Order) => {
    markSeen(order);
    setSelectedOrder(order);
  }, [markSeen]);

  const activeStatuses = new Set(["NEW", "PREPARING", "READY"]);
  const completedStatuses = new Set(["SERVED", "PAID", "CANCELLED"]);

  const filtered = filterStatus === "ALL"
    ? orders
    : filterStatus === "ACTIVE"
    ? orders.filter((o) => activeStatuses.has(o.status))
    : filterStatus === "DONE"
    ? orders.filter((o) => completedStatuses.has(o.status))
    : orders.filter((o) => o.status === filterStatus);

  const countByStatus = (status: string) => orders.filter((o) => o.status === status).length;
  const newCount = countByStatus("NEW");
  const unseenNewCount = orders.filter((o) => o.status === "NEW" && !o.seenAt).length;

  return (
    <div className="h-full flex flex-col">
      <div className="px-8 pt-7 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {orders.length} total &bull; {newCount} new{unseenNewCount > 0 ? ` (${unseenNewCount} unseen)` : ""}
            </p>
          </div>
          <button
            onClick={() => fetchOrders(false)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-50 shadow-sm"
          >
            <span className={isRefreshing ? "animate-spin" : ""}>↻</span>
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="px-8 pb-3 flex gap-2 flex-wrap">
        {[
          { key: "ACTIVE", label: "Active", count: orders.filter((o) => activeStatuses.has(o.status)).length },
          { key: "NEW", label: "New", count: countByStatus("NEW") },
          { key: "PREPARING", label: "Preparing", count: countByStatus("PREPARING") },
          { key: "READY", label: "Ready", count: countByStatus("READY") },
          { key: "DONE", label: "Done", count: orders.filter((o) => completedStatuses.has(o.status)).length },
          { key: "ALL", label: "All", count: orders.length },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilterStatus(key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition flex items-center gap-1.5 ${
              filterStatus === key
                ? "bg-gray-900 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
              filterStatus === key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
            }`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto px-8 pb-8">
        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 mt-2">
            <p className="text-5xl mb-3">📋</p>
            <p className="text-gray-500 font-medium text-lg">No orders here</p>
            <p className="text-gray-400 text-sm mt-1">New orders will appear automatically</p>
          </div>
        ) : (
          <div className="grid gap-3 mt-2">
            {filtered.map((order) => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.NEW;
              const isUnseen = order.status === "NEW" && !order.seenAt;
              const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1];
              const canAdvance = nextStatus && nextStatus !== "CANCELLED";
              const total = getPrice(order.total);

              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-2xl border-2 shadow-sm hover:shadow-md transition-all ${cfg.card} ${isUnseen ? "ring-2 ring-blue-400 ring-offset-1" : ""}`}
                >
                  <div className="p-4 flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot} shrink-0`} />
                      {isUnseen && (
                        <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-bold leading-none">
                          NEW
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openOrder(order)}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 text-sm">{order.orderNumber}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.badge}`}>
                              {cfg.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                            {order.table
                              ? <><strong className="text-gray-700">Table {order.table.tableNumber}</strong></>
                              : order.customerName
                              ? <strong className="text-gray-700">{order.customerName}</strong>
                              : null}
                            {order.orderType && ORDER_TYPE_CONFIG[order.orderType] && (
                              <span className={`text-xs px-1.5 py-0.5 rounded-full border font-medium ${ORDER_TYPE_CONFIG[order.orderType].badge}`}>
                                {ORDER_TYPE_CONFIG[order.orderType].icon} {ORDER_TYPE_CONFIG[order.orderType].label}
                              </span>
                            )}
                            <span className="text-gray-300">·</span>
                            {timeAgo(order.createdAt)}
                          </p>
                        </div>
                        <p className="text-base font-bold text-gray-900 shrink-0">{formatPrice(total)}</p>
                      </div>

                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {order.orderItems.slice(0, 4).map((item) => (
                          <span key={item.id} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                            {item.quantity}× {item.nameSnapshot}
                          </span>
                        ))}
                        {order.orderItems.length > 4 && (
                          <span className="text-xs bg-gray-100 text-gray-400 px-2.5 py-1 rounded-full">
                            +{order.orderItems.length - 4} more
                          </span>
                        )}
                      </div>

                      {order.notes && (
                        <p className="mt-2 text-xs text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg">
                          📝 {order.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="px-4 pb-4 flex items-center gap-2">
                    {canAdvance && (
                      <button
                        onClick={() => updateStatus(order.id, nextStatus)}
                        disabled={updatingId === order.id}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition disabled:opacity-50 flex-1"
                      >
                        {updatingId === order.id ? "..." : NEXT_STATUS_LABEL[order.status] || `→ ${STATUS_CONFIG[nextStatus]?.label}`}
                      </button>
                    )}
                    <button
                      onClick={() => openOrder(order)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition"
                    >
                      Details
                    </button>
                    {order.status !== "CANCELLED" && order.status !== "PAID" && (
                      <button
                        onClick={() => updateStatus(order.id, "CANCELLED")}
                        disabled={updatingId === order.id}
                        className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-semibold rounded-xl transition"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={updateStatus}
          updatingId={updatingId}
        />
      )}
    </div>
  );
}
