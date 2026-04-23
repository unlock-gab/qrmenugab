"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";

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
  createdAt: string | Date;
  table: { tableNumber: string };
  orderItems: OrderItem[];
};

const STATUS_FLOW = ["NEW", "PREPARING", "READY", "SERVED", "PAID", "CANCELLED"];

const STATUS_STYLES: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700 border-blue-200",
  PREPARING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  READY: "bg-green-100 text-green-700 border-green-200",
  SERVED: "bg-gray-100 text-gray-600 border-gray-200",
  PAID: "bg-purple-100 text-purple-700 border-purple-200",
  CANCELLED: "bg-red-100 text-red-600 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  NEW: "New Order",
  PREPARING: "Preparing",
  READY: "Ready",
  SERVED: "Served",
  PAID: "Paid",
  CANCELLED: "Cancelled",
};

export function OrdersClient({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const prevOrderCount = useRef(initialOrders.length);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const newOrders: Order[] = await res.json();
        if (newOrders.length > prevOrderCount.current) {
          const newCount = newOrders.length - prevOrderCount.current;
          toast.info(`${newCount} new order${newCount > 1 ? "s" : ""} received!`);
          if (audioRef.current) {
            audioRef.current.play().catch(() => null);
          }
        }
        prevOrderCount.current = newOrders.length;
        setOrders(newOrders);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, []);

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
      toast.success(`Order ${status.toLowerCase()}`);
    } else {
      toast.error("Failed to update order");
    }
  }, []);

  const filtered = filterStatus === "ALL"
    ? orders
    : orders.filter((o) => o.status === filterStatus);

  const getNextStatus = (current: string) => {
    const idx = STATUS_FLOW.indexOf(current);
    if (idx < STATUS_FLOW.length - 2) return STATUS_FLOW[idx + 1];
    return null;
  };

  return (
    <div>
      <audio ref={audioRef} src="/notification.mp3" preload="none" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 text-sm mt-1">{orders.length} total orders</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Refreshes every 15s</span>
          <button
            onClick={async () => {
              const res = await fetch("/api/orders");
              if (res.ok) setOrders(await res.json());
            }}
            className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {["ALL", ...STATUS_FLOW].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              filterStatus === status
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {status === "ALL" ? "All" : STATUS_LABELS[status]}
            {status !== "ALL" && (
              <span className="ml-1.5 text-xs opacity-70">
                ({orders.filter((o) => o.status === status).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-gray-500 font-medium">No orders {filterStatus !== "ALL" ? `with status "${filterStatus}"` : "yet"}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((order) => {
            const nextStatus = getNextStatus(order.status);
            const createdAt = new Date(order.createdAt);
            return (
              <div key={order.id} className={`bg-white rounded-2xl border p-5 ${
                order.status === "NEW" ? "border-blue-200 shadow-blue-50 shadow-md" : "border-gray-100"
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-gray-900">{order.orderNumber}</h3>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${STATUS_STYLES[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Table {order.table.tableNumber} &bull;{" "}
                      {createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {" "}on{" "}
                      {createdAt.toLocaleDateString([], { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{formatPrice(order.total)}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  {order.orderItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm py-1">
                      <span className="text-gray-700">
                        <span className="font-medium">{item.quantity}x</span> {item.nameSnapshot}
                      </span>
                      <span className="text-gray-600">{formatPrice(item.totalPrice)}</span>
                    </div>
                  ))}
                  {order.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">Note:</span> {order.notes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 flex-wrap">
                  {nextStatus && (
                    <button
                      onClick={() => updateStatus(order.id, nextStatus)}
                      disabled={updatingId === order.id}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-xl transition disabled:opacity-50"
                    >
                      {updatingId === order.id ? "..." : `Mark as ${STATUS_LABELS[nextStatus]}`}
                    </button>
                  )}
                  {order.status !== "CANCELLED" && order.status !== "PAID" && (
                    <button
                      onClick={() => updateStatus(order.id, "CANCELLED")}
                      disabled={updatingId === order.id}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-xl transition disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
