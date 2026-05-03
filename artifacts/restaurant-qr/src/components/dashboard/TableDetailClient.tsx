"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, CheckCheck, Clock, RotateCcw, CreditCard } from "lucide-react";
import { formatDA } from "@/lib/i18n";

type OrderStatus = "NEW" | "PREPARING" | "READY" | "SERVED";
type ReqType = "CALL_WAITER" | "REQUEST_BILL" | "HELP";
type ReqStatus = "PENDING" | "HANDLED";

interface OrderItem {
  id: string; nameSnapshot: string; quantity: number; unitPrice: number;
}
interface Order {
  id: string; orderNumber: string; status: string; paymentStatus: string;
  total: number; notes: string | null; createdAt: string; orderItems: OrderItem[];
}
interface WaiterReq {
  id: string; type: ReqType; status: ReqStatus; notes: string | null; createdAt: string;
}

const ORDER_STATUS: Record<string, { label: string; badge: string; next?: string; nextLabel?: string }> = {
  NEW:      { label: "Nouveau",   badge: "bg-blue-100 text-blue-700",     next: "PREPARING", nextLabel: "Mettre en préparation" },
  PREPARING:{ label: "En cours",  badge: "bg-amber-100 text-amber-700",   next: "READY",     nextLabel: "Marquer prêt" },
  READY:    { label: "Prêt ✓",   badge: "bg-emerald-100 text-emerald-700", next: "SERVED",   nextLabel: "Marquer servi" },
  SERVED:   { label: "Servi",     badge: "bg-gray-100 text-gray-600" },
};

const REQ_CONFIG: Record<ReqType, { label: string; icon: string; badge: string }> = {
  CALL_WAITER:  { label: "Appel serveur",   icon: "🙋", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  REQUEST_BILL: { label: "Demande addition", icon: "🧾", badge: "bg-purple-50 text-purple-700 border-purple-200" },
  HELP:         { label: "Aide requise",     icon: "❓", badge: "bg-red-50 text-red-700 border-red-200" },
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  return `${Math.floor(diff / 3600)}h`;
}

export function TableDetailClient({
  table, orders: initialOrders, waiterRequests: initialRequests, restaurantSlug,
}: {
  table: { id: string; tableNumber: string; qrToken: string };
  orders: Order[];
  waiterRequests: WaiterReq[];
  restaurantSlug: string;
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [requests, setRequests] = useState(initialRequests);
  const [updating, setUpdating] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    const [oRes, rRes] = await Promise.all([
      fetch(`/api/tables/${table.id}/orders`),
      fetch(`/api/tables/${table.id}/requests`),
    ]);
    if (oRes.ok) setOrders(await oRes.json());
    if (rRes.ok) setRequests(await rRes.json());
  }, [table.id]);

  const advanceOrder = async (orderId: string, status: string) => {
    setUpdating(orderId);
    await fetch(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdating(null);
    // Optimistic update
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
  };

  const handleRequest = async (reqId: string) => {
    await fetch(`/api/waiter-requests/${reqId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "HANDLED" }),
    });
    setRequests((prev) => prev.map((r) => r.id === reqId ? { ...r, status: "HANDLED" as ReqStatus } : r));
  };

  const activeOrders = orders.filter((o) => o.status !== "SERVED" || true); // show all active
  const pendingReqs = requests.filter((r) => r.status === "PENDING");
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const menuUrl = typeof window !== "undefined"
    ? `${window.location.origin}/menu/${restaurantSlug}/${table.qrToken}`
    : "";

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/merchant/tables" className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-gray-900">Table {table.tableNumber}</h1>
          <p className="text-gray-400 text-sm">{activeOrders.length} commande{activeOrders.length !== 1 ? "s" : ""} active{activeOrders.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-3">
          {menuUrl && (
            <a href={menuUrl} target="_blank" rel="noopener noreferrer"
              className="text-xs text-orange-500 hover:text-orange-600 border border-orange-200 px-3 py-2 rounded-xl font-semibold">
              Voir le menu →
            </a>
          )}
          <button onClick={refreshData}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-2 rounded-xl">
            <RotateCcw className="w-3.5 h-3.5" /> Actualiser
          </button>
        </div>
      </div>

      {/* Pending requests alert */}
      {pendingReqs.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 mb-5">
          <p className="text-amber-800 font-bold text-sm mb-3 flex items-center gap-2">
            <Bell className="w-4 h-4" /> {pendingReqs.length} demande{pendingReqs.length > 1 ? "s" : ""} en attente
          </p>
          <div className="space-y-2">
            {pendingReqs.map((r) => {
              const cfg = REQ_CONFIG[r.type];
              return (
                <div key={r.id} className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${cfg.badge}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{cfg.icon}</span>
                    <div>
                      <p className="font-semibold text-sm">{cfg.label}</p>
                      {r.notes && <p className="text-xs opacity-70">{r.notes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs opacity-60 flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(r.createdAt)}</span>
                    <button onClick={() => handleRequest(r.id)}
                      className="bg-white/70 hover:bg-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition">
                      <CheckCheck className="w-3.5 h-3.5" /> Traité
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-black text-gray-900">{activeOrders.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Commandes actives</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-black text-gray-900">{formatDA(totalRevenue)}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total en cours</p>
        </div>
        <div className={`rounded-2xl border p-4 text-center ${pendingReqs.length > 0 ? "bg-amber-50 border-amber-200" : "bg-white border-gray-100"}`}>
          <p className={`text-2xl font-black ${pendingReqs.length > 0 ? "text-amber-600" : "text-gray-400"}`}>{pendingReqs.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Demandes service</p>
        </div>
      </div>

      {/* Orders */}
      <div className="space-y-4">
        {activeOrders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
            <CheckCheck className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-semibold">Aucune commande active sur cette table</p>
          </div>
        ) : (
          activeOrders.map((order) => {
            const cfg = ORDER_STATUS[order.status as OrderStatus] || ORDER_STATUS.NEW;
            return (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-900">#{order.orderNumber}</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${cfg.badge}`}>{cfg.label}</span>
                    {order.paymentStatus === "UNPAID" && (
                      <span className="flex items-center gap-1 text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">
                        <CreditCard className="w-3 h-3" /> Impayé
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {timeAgo(order.createdAt)}
                    </span>
                    <span className="font-bold text-gray-900 text-sm">{formatDA(order.total)}</span>
                  </div>
                </div>

                <div className="px-5 py-4">
                  <div className="space-y-1.5 mb-3">
                    {order.orderItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">
                          <span className="font-semibold">{item.quantity}×</span> {item.nameSnapshot}
                        </span>
                        <span className="text-gray-500 text-xs">{formatDA(item.unitPrice * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <div className="bg-gray-50 rounded-xl px-3 py-2 mb-3 text-xs text-gray-500 italic">
                      📝 {order.notes}
                    </div>
                  )}

                  {cfg.next && (
                    <button
                      onClick={() => advanceOrder(order.id, cfg.next!)}
                      disabled={updating === order.id}
                      className={`w-full py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-50 ${
                        cfg.next === "SERVED"
                          ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                          : "bg-gray-900 hover:bg-gray-800 text-white"
                      }`}
                    >
                      {updating === order.id ? "Mise à jour…" : cfg.nextLabel}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
