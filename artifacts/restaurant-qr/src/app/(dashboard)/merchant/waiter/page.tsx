"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { formatDA } from "@/lib/i18n";
import { RefreshCw, CheckCheck, Bell } from "lucide-react";

interface OrderItem { id: string; nameSnapshot: string; quantity: number; }
interface Order {
  id: string; orderNumber: string; status: string; paymentStatus: string;
  total: number; createdAt: string; notes?: string | null; orderItems: OrderItem[];
}
interface TableData {
  id: string; tableNumber: string;
  orders: Order[]; activeOrderCount: number;
  hasReadyOrders: boolean; hasNewOrders: boolean; unpaidTotal: number;
}
interface WaiterRequest {
  id: string; type: "CALL_WAITER" | "REQUEST_BILL" | "HELP";
  status: "PENDING" | "HANDLED"; createdAt: string;
  table: { tableNumber: string };
}

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  NEW:      { label: "Nouveau",  badge: "bg-blue-100 text-blue-700 border-blue-200" },
  PREPARING:{ label: "En cours", badge: "bg-amber-100 text-amber-700 border-amber-200" },
  READY:    { label: "Prêt ✓",  badge: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  SERVED:   { label: "Servi",   badge: "bg-gray-100 text-gray-600 border-gray-200" },
};

const REQ_CONFIG: Record<string, { label: string; icon: string; badge: string }> = {
  CALL_WAITER:  { label: "Appel serveur",   icon: "🙋", badge: "bg-amber-100 text-amber-800 border-amber-200" },
  REQUEST_BILL: { label: "Demande addition", icon: "🧾", badge: "bg-purple-100 text-purple-700 border-purple-200" },
  HELP:         { label: "Aide requise",     icon: "❓", badge: "bg-red-100 text-red-700 border-red-200" },
};

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  return `${Math.floor(diff / 3600)}h`;
}

export default function WaiterPage() {
  const [tables, setTables] = useState<TableData[]>([]);
  const [requests, setRequests] = useState<WaiterRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchData = useCallback(async () => {
    try {
      const [tRes, rRes] = await Promise.all([
        fetch("/api/waiter/tables"),
        fetch("/api/waiter-requests?status=PENDING"),
      ]);
      if (tRes.ok) setTables(await tRes.json());
      if (rRes.ok) setRequests(await rRes.json());
      setLastRefresh(new Date());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const markServed = async (orderId: string) => {
    setUpdating(orderId);
    await fetch(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "SERVED" }),
    });
    setUpdating(null);
    fetchData();
  };

  const handleRequest = async (reqId: string) => {
    await fetch(`/api/waiter-requests/${reqId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "HANDLED" }),
    });
    fetchData();
  };

  const activeTables = tables.filter((t) => t.activeOrderCount > 0);
  const pendingRequests = requests.filter((r) => r.status === "PENDING");

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-60">
        <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Espace Serveur</h1>
          <p className="text-gray-400 text-sm mt-0.5 flex items-center gap-2">
            <RefreshCw className="w-3 h-3" />
            Actualisé à {lastRefresh.toLocaleTimeString("fr-DZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse inline-block" />
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <Link href="/merchant/service"
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition ${pendingRequests.length > 0 ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
            <Bell className="w-4 h-4" />
            {pendingRequests.length} demande{pendingRequests.length !== 1 ? "s" : ""}
          </Link>
          <Link href="/merchant/tables" className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-2 rounded-xl">
            Vue tables →
          </Link>
        </div>
      </div>

      {/* Pending requests alert */}
      {pendingRequests.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 mb-5">
          <p className="text-amber-800 font-bold text-sm mb-3 flex items-center gap-2">
            <Bell className="w-4 h-4" /> {pendingRequests.length} demande{pendingRequests.length > 1 ? "s" : ""} de service en attente
          </p>
          <div className="flex flex-wrap gap-2">
            {pendingRequests.map((r) => {
              const cfg = REQ_CONFIG[r.type];
              return (
                <div key={r.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${cfg.badge}`}>
                  <span>{cfg.icon}</span>
                  <span>Table {r.table.tableNumber} · {cfg.label}</span>
                  <span className="opacity-60">{timeAgo(r.createdAt)}</span>
                  <button onClick={() => handleRequest(r.id)}
                    className="ml-1 bg-white/60 hover:bg-white px-2 py-0.5 rounded-lg font-bold transition">✓</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-blue-50 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-blue-600">{activeTables.length}</p>
          <p className="text-xs font-semibold text-gray-500 mt-0.5">Tables actives</p>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-emerald-600">{tables.filter((t) => t.hasReadyOrders).length}</p>
          <p className="text-xs font-semibold text-gray-500 mt-0.5">Tables avec plats prêts</p>
        </div>
        <div className="bg-amber-50 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-amber-600">{pendingRequests.length}</p>
          <p className="text-xs font-semibold text-gray-500 mt-0.5">Appels en attente</p>
        </div>
      </div>

      {activeTables.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center">
          <CheckCheck className="w-14 h-14 text-emerald-200 mx-auto mb-4" />
          <p className="text-gray-500 font-semibold text-lg">Aucune table active</p>
          <p className="text-gray-400 text-sm mt-1">Les commandes actives apparaîtront ici automatiquement</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeTables.map((table) => (
            <div
              key={table.id}
              className={`bg-white rounded-2xl border-2 p-5 shadow-sm transition-all ${
                table.hasReadyOrders
                  ? "border-emerald-300 shadow-emerald-50"
                  : table.hasNewOrders
                  ? "border-blue-200"
                  : "border-gray-200"
              }`}
            >
              {/* Table header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${
                    table.hasReadyOrders ? "bg-emerald-100 text-emerald-700" :
                    table.hasNewOrders ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                  }`}>
                    {table.tableNumber}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Table {table.tableNumber}</p>
                    <p className="text-xs text-gray-400">{table.activeOrderCount} commande{table.activeOrderCount > 1 ? "s" : ""}</p>
                  </div>
                </div>
                {table.hasReadyOrders && (
                  <span className="text-xs bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-bold animate-pulse">
                    Prêt ✓
                  </span>
                )}
              </div>

              {/* Orders */}
              <div className="space-y-3 mb-4">
                {table.orders.map((order) => {
                  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.NEW;
                  return (
                    <div key={order.id} className={`rounded-xl border p-3 ${cfg.badge.split(" ").includes("border-emerald-200") ? "bg-emerald-50" : "bg-gray-50"} border-gray-200`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-800 text-xs">#{order.orderNumber}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${cfg.badge}`}>{cfg.label}</span>
                        </div>
                        <span className="font-bold text-xs text-gray-700">{formatDA(order.total)}</span>
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        {order.orderItems.slice(0, 3).map((i) => `${i.quantity}× ${i.nameSnapshot}`).join(", ")}
                        {order.orderItems.length > 3 && ` +${order.orderItems.length - 3}`}
                      </div>
                      {order.status === "READY" && (
                        <button
                          onClick={() => markServed(order.id)}
                          disabled={updating === order.id}
                          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-xl text-xs font-bold transition disabled:opacity-50"
                        >
                          {updating === order.id ? "Mise à jour…" : "✓ Marquer servi"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Unpaid total */}
              {table.unpaidTotal > 0 && (
                <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 border border-gray-200">
                  <span className="text-xs font-semibold text-gray-600">Total impayé</span>
                  <span className="font-black text-sm text-gray-900">{formatDA(table.unpaidTotal)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
