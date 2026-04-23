"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface OrderItem { id: string; nameSnapshot: string; quantity: number; unitPrice: number; }
interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string | null;
  total: number;
  createdAt: string;
  notes?: string | null;
  table: { tableNumber: string };
  orderItems: OrderItem[];
}

const METHOD_LABELS: Record<string, string> = {
  CASH: "كاش 💵", CARD: "بطاقة 💳", TRANSFER: "تحويل 📲", OTHER: "أخرى",
};
const STATUS_AR: Record<string, string> = {
  NEW: "جديد", PREPARING: "يُحضَّر", READY: "جاهز", SERVED: "قُدِّم", PAID: "مدفوع",
};

function PayDialog({ order, onPay, onClose }: { order: Order; onPay: (method: string) => void; onClose: () => void }) {
  const [method, setMethod] = useState("CASH");
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">تأكيد الدفع</h2>
        <p className="text-sm text-gray-500 mb-4">طاولة {order.table.tableNumber} — طلب #{order.orderNumber}</p>
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          {order.orderItems.map((i) => (
            <div key={i.id} className="flex justify-between text-sm py-1">
              <span>{i.quantity}× {i.nameSnapshot}</span>
              <span className="font-medium">{(i.unitPrice * i.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-bold text-gray-900">
            <span>الإجمالي</span>
            <span>{Number(order.total).toFixed(2)}</span>
          </div>
        </div>
        <p className="text-sm font-semibold text-gray-700 mb-2">طريقة الدفع</p>
        <div className="grid grid-cols-2 gap-2 mb-5">
          {(["CASH", "CARD", "TRANSFER", "OTHER"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`py-3 rounded-xl font-semibold text-sm transition-colors ${method === m ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              {METHOD_LABELS[m]}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors">إلغاء</button>
          <button onClick={() => onPay(method)} className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors">تأكيد الدفع ✓</button>
        </div>
      </div>
    </div>
  );
}

export default function CashierPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);
  const [paying, setPaying] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/cashier", { cache: "no-store" });
      if (res.ok) setOrders(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchOrders();
    const i = setInterval(fetchOrders, 10000);
    return () => clearInterval(i);
  }, [fetchOrders]);

  const handlePay = async (method: string) => {
    if (!selected) return;
    setPaying(true);
    try {
      const res = await fetch(`/api/orders/${selected.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod: method }),
      });
      if (res.ok) {
        const paid = await res.json();
        setSelected(null);
        fetchOrders();
        window.open(`/print/${paid.id}`, "_blank");
      }
    } finally { setPaying(false); }
  };

  const served = orders.filter((o) => o.status === "SERVED");
  const other = orders.filter((o) => o.status !== "SERVED");
  const totalUnpaid = orders.reduce((s, o) => s + Number(o.total), 0);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {selected && <PayDialog order={selected} onPay={handlePay} onClose={() => setSelected(null)} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">وضع الكاشير</h1>
          <p className="text-sm text-gray-500 mt-0.5">إتمام المدفوعات وإصدار الفواتير</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-gray-900">{totalUnpaid.toFixed(2)}</div>
          <div className="text-xs text-gray-400">إجمالي غير مسدّد</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
          <div className="text-3xl font-black text-amber-600">{orders.length}</div>
          <div className="text-xs text-amber-500 font-medium mt-1">طلبات غير مسددة</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
          <div className="text-3xl font-black text-emerald-600">{served.length}</div>
          <div className="text-xs text-emerald-500 font-medium mt-1">قُدِّمت (جاهزة للدفع)</div>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
          <div className="text-3xl font-black text-blue-600">{other.length}</div>
          <div className="text-xs text-blue-500 font-medium mt-1">قيد التحضير</div>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-16">جاري التحميل...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">✅</div>
          <p className="font-medium">جميع الطلبات مسددة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {served.length > 0 && (
            <h2 className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">جاهزة للدفع</h2>
          )}
          {served.map((order) => (
            <OrderCard key={order.id} order={order} onPay={() => setSelected(order)} priority />
          ))}
          {other.length > 0 && served.length > 0 && (
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mt-4">قيد التحضير</h2>
          )}
          {other.map((order) => (
            <OrderCard key={order.id} order={order} onPay={() => setSelected(order)} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, onPay, priority }: { order: Order; onPay: () => void; priority?: boolean }) {
  const ago = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
  return (
    <div className={`bg-white rounded-2xl border-2 shadow-sm p-4 ${priority ? "border-emerald-300" : "border-gray-100"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg font-black text-gray-900">#{order.orderNumber}</span>
            <span className="text-sm font-semibold text-gray-500">طاولة {order.table.tableNumber}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${priority ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
              {STATUS_AR[order.status] || order.status}
            </span>
            <span className="text-xs text-gray-400">{ago}د</span>
          </div>
          <div className="text-sm text-gray-600 space-y-0.5">
            {order.orderItems.map((i) => (
              <div key={i.id}>{i.quantity}× {i.nameSnapshot}</div>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className="text-xl font-black text-gray-900">{Number(order.total).toFixed(2)}</span>
          <div className="flex gap-1.5">
            <Link
              href={`/print/${order.id}`}
              target="_blank"
              className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold transition-colors"
            >
              🖨️ طباعة
            </Link>
            <button
              onClick={onPay}
              className={`px-4 py-1.5 rounded-lg text-white text-xs font-bold transition-colors ${priority ? "bg-emerald-600 hover:bg-emerald-700" : "bg-indigo-500 hover:bg-indigo-600"}`}
            >
              دفع ✓
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
