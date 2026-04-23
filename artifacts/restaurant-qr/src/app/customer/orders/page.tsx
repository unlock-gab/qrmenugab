"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { t, formatDA, getLang, setLang, type Locale } from "@/lib/i18n";

interface OrderItem { nameSnapshot: string; quantity: number; unitPrice: number }
interface CustomerOrder {
  id: string; orderNumber: string; orderType: string; status: string;
  finalTotal: number; total: number; discountAmount: number;
  createdAt: string;
  restaurant: { name: string; currency: string };
  branch: { name: string } | null;
  orderItems: OrderItem[];
}
interface CustomerProfile { id: string; name: string; email: string; phone: string | null }

const STATUS_COLOR: Record<string, string> = {
  NEW: "bg-blue-50 text-blue-600", PREPARING: "bg-amber-50 text-amber-600",
  READY: "bg-green-50 text-green-600", SERVED: "bg-gray-50 text-gray-500",
  PAID: "bg-emerald-50 text-emerald-600", CANCELLED: "bg-red-50 text-red-500",
};

export default function CustomerOrdersPage() {
  const router = useRouter();
  const [lang, setLangState] = useState<Locale>("fr");
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { setLangState(getLang()); }, []);
  const switchLang = () => { const n: Locale = lang === "fr" ? "ar" : "fr"; setLang(n); setLangState(n); };
  const tr = (key: Parameters<typeof t>[0]) => t(key, lang);
  const isRTL = lang === "ar";

  useEffect(() => {
    Promise.all([
      fetch("/api/customer/auth/me").then((r) => r.ok ? r.json() : null),
      fetch("/api/customer/orders").then((r) => r.ok ? r.json() : []),
    ]).then(([profile, ords]) => {
      if (!profile) { router.push("/customer/login"); return; }
      setCustomer(profile);
      setOrders(ords);
    }).finally(() => setLoading(false));
  }, [router]);

  const logout = async () => {
    await fetch("/api/customer/auth/logout", { method: "POST" });
    router.push("/customer/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-400 text-sm">Chargement…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? "rtl" : "ltr"}>
      <div className="bg-orange-500 text-white px-4 pt-12 pb-6">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{customer?.name} 👋</h1>
            <p className="text-white/70 text-sm">{customer?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={switchLang} className="text-xs bg-white/20 px-2.5 py-1.5 rounded-lg hover:bg-white/30 transition font-bold">
              {lang === "fr" ? "عر" : "FR"}
            </button>
            <button onClick={logout} className="text-xs bg-white/20 px-3 py-1.5 rounded-lg hover:bg-white/30 transition">
              {tr("logout")}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">{tr("myOrders")}</h2>
          <span className="text-sm text-gray-400">{orders.length}</span>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-500 font-medium">{tr("noOrders")}</p>
            <p className="text-gray-400 text-sm mt-1">{tr("noOrdersSub")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="p-4 cursor-pointer" onClick={() => setExpanded(expanded === order.id ? null : order.id)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900">#{order.orderNumber}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[order.status] || "bg-gray-50 text-gray-500"}`}>
                          {tr(order.status as Parameters<typeof tr>[0]) || order.status}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          {tr(order.orderType as Parameters<typeof tr>[0]) || order.orderType}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {order.restaurant.name}{order.branch ? ` · ${order.branch.name}` : ""}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString(lang === "ar" ? "ar" : "fr-FR", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-gray-900">{formatDA(order.finalTotal)}</p>
                      {order.discountAmount > 0 && (
                        <p className="text-xs text-emerald-600">{tr("saved")} {formatDA(order.discountAmount)}</p>
                      )}
                    </div>
                  </div>
                </div>
                {expanded === order.id && (
                  <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                    {order.orderItems.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm py-0.5">
                        <span>{item.quantity}× {item.nameSnapshot}</span>
                        <span className="text-gray-500">{formatDA(Number(item.unitPrice) * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
