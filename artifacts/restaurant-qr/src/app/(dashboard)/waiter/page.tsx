"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface OrderItem { id: string; nameSnapshot: string; quantity: number; }
interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  notes?: string | null;
  orderItems: OrderItem[];
}
interface TableData {
  id: string;
  tableNumber: string;
  orders: Order[];
  activeOrderCount: number;
  hasReadyOrders: boolean;
  hasNewOrders: boolean;
  unpaidTotal: number;
}

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-red-100 text-red-700 border-red-200",
  PREPARING: "bg-amber-100 text-amber-700 border-amber-200",
  READY: "bg-emerald-100 text-emerald-700 border-emerald-200",
  SERVED: "bg-blue-100 text-blue-700 border-blue-200",
};
const STATUS_AR: Record<string, string> = {
  NEW: "جديد", PREPARING: "يُحضَّر", READY: "جاهز ✓", SERVED: "قُدِّم",
};

export default function WaiterPage() {
  const [tables, setTables] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [serving, setServing] = useState<string | null>(null);

  const fetchTables = useCallback(async () => {
    try {
      const res = await fetch("/api/waiter", { cache: "no-store" });
      if (res.ok) setTables(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchTables();
    const i = setInterval(fetchTables, 10000);
    return () => clearInterval(i);
  }, [fetchTables]);

  const handleServe = async (orderId: string) => {
    setServing(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SERVED" }),
      });
      if (res.ok) fetchTables();
    } finally { setServing(null); }
  };

  const activeTables = tables.filter((t) => t.activeOrderCount > 0);
  const idleTables = tables.filter((t) => t.activeOrderCount === 0);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">وضع النادل</h1>
          <p className="text-sm text-gray-500 mt-0.5">إدارة الطلبات والطاولات</p>
        </div>
        <Link
          href="/waiter/new-order"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
        >
          + طلب يدوي
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
          <div className="text-3xl font-black text-red-600">
            {tables.reduce((s, t) => s + t.orders.filter((o) => o.status === "NEW").length, 0)}
          </div>
          <div className="text-xs text-red-500 font-medium mt-1">طلبات جديدة</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
          <div className="text-3xl font-black text-emerald-600">
            {tables.reduce((s, t) => s + t.orders.filter((o) => o.status === "READY").length, 0)}
          </div>
          <div className="text-xs text-emerald-500 font-medium mt-1">جاهز للتقديم</div>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
          <div className="text-3xl font-black text-blue-600">{activeTables.length}</div>
          <div className="text-xs text-blue-500 font-medium mt-1">طاولات نشطة</div>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-16">جاري التحميل...</div>
      ) : (
        <>
          {activeTables.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">الطاولات النشطة</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeTables.map((table) => (
                  <div
                    key={table.id}
                    className={`bg-white rounded-2xl border-2 shadow-sm p-4 ${table.hasReadyOrders ? "border-emerald-400" : table.hasNewOrders ? "border-red-300" : "border-gray-100"}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-900">طاولة {table.tableNumber}</h3>
                        {table.hasReadyOrders && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500 text-white animate-pulse">
                            جاهز!
                          </span>
                        )}
                      </div>
                      {table.unpaidTotal > 0 && (
                        <span className="text-sm font-semibold text-gray-600">
                          {table.unpaidTotal.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {table.orders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                              {STATUS_AR[order.status] || order.status}
                            </span>
                            <span className="text-sm text-gray-500 font-mono truncate">#{order.orderNumber}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                              {order.orderItems.map((i) => `${i.quantity}× ${i.nameSnapshot}`).join("، ")}
                            </span>
                            {order.status === "READY" && (
                              <button
                                onClick={() => handleServe(order.id)}
                                disabled={serving === order.id}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                              >
                                {serving === order.id ? "..." : "قُدِّم ✓"}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {idleTables.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">طاولات فارغة ({idleTables.length})</h2>
              <div className="flex flex-wrap gap-2">
                {idleTables.map((t) => (
                  <div key={t.id} className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500">
                    طاولة {t.tableNumber}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tables.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-3">🍽️</div>
              <p>لا توجد طاولات مفعّلة</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
