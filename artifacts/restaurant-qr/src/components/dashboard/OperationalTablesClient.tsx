"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { RefreshCw, Users, Bell, CreditCard, UtensilsCrossed, Circle } from "lucide-react";
import { formatDA } from "@/lib/i18n";

type TableStatus = "LIBRE" | "OCCUPEE" | "SERVICE" | "ADDITION";

interface ActiveOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  paymentStatus: string;
  itemCount: number;
}

interface WaiterReq {
  id: string;
  type: "CALL_WAITER" | "REQUEST_BILL" | "HELP";
  status: "PENDING" | "HANDLED";
  createdAt: string;
}

interface OperationalTable {
  id: string;
  tableNumber: string;
  qrToken: string;
  isActive: boolean;
  activeOrders: ActiveOrder[];
  pendingRequests: WaiterReq[];
}

const STATUS_DISPLAY: Record<TableStatus, { label: string; bg: string; border: string; dot: string; icon: React.ReactNode }> = {
  LIBRE:    { label: "Libre",       bg: "bg-white",            border: "border-gray-200",    dot: "bg-gray-300",    icon: <Circle className="w-3.5 h-3.5 text-gray-300" /> },
  OCCUPEE:  { label: "Occupée",     bg: "bg-blue-50",          border: "border-blue-200",    dot: "bg-blue-400",    icon: <UtensilsCrossed className="w-3.5 h-3.5 text-blue-500" /> },
  SERVICE:  { label: "Appel",       bg: "bg-amber-50",         border: "border-amber-300",   dot: "bg-amber-400",   icon: <Bell className="w-3.5 h-3.5 text-amber-500" /> },
  ADDITION: { label: "Addition",    bg: "bg-purple-50",        border: "border-purple-300",  dot: "bg-purple-500",  icon: <CreditCard className="w-3.5 h-3.5 text-purple-500" /> },
};

const REQ_TYPE_LABEL: Record<string, string> = {
  CALL_WAITER: "Serveur", REQUEST_BILL: "Addition", HELP: "Aide",
};

const ORDER_STATUS_FR: Record<string, string> = {
  NEW: "Nouveau", PREPARING: "En cours", READY: "Prêt", SERVED: "Servi",
};

function deriveStatus(table: OperationalTable): TableStatus {
  const billReq = table.pendingRequests.some((r) => r.status === "PENDING" && r.type === "REQUEST_BILL");
  const callReq = table.pendingRequests.some((r) => r.status === "PENDING" && r.type !== "REQUEST_BILL");
  if (billReq) return "ADDITION";
  if (callReq) return "SERVICE";
  if (table.activeOrders.length > 0) return "OCCUPEE";
  return "LIBRE";
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  return `${Math.floor(diff / 3600)}h`;
}

function TableCard({ table, restaurantSlug }: { table: OperationalTable; restaurantSlug: string }) {
  const status = deriveStatus(table);
  const cfg = STATUS_DISPLAY[status];
  const totalRevenue = table.activeOrders.reduce((s, o) => s + o.total, 0);
  const pendingReqs = table.pendingRequests.filter((r) => r.status === "PENDING");

  return (
    <Link href={`/merchant/tables/${table.id}`}>
      <div className={`rounded-2xl border-2 p-4 flex flex-col gap-3 cursor-pointer transition-all hover:shadow-md ${cfg.bg} ${cfg.border} ${status !== "LIBRE" ? "shadow-sm" : ""}`}>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Table</p>
            <p className="text-2xl font-black text-gray-900 leading-tight">{table.tableNumber}</p>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.border}`}>
            {cfg.icon}
            <span>{cfg.label}</span>
            {(status === "SERVICE" || status === "ADDITION") && (
              <span className={`w-2 h-2 ${cfg.dot} rounded-full animate-pulse`} />
            )}
          </div>
        </div>

        {/* Active orders */}
        {table.activeOrders.length > 0 && (
          <div className="space-y-1.5">
            {table.activeOrders.slice(0, 2).map((o) => (
              <div key={o.id} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-gray-600">#{o.orderNumber}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                    o.status === "NEW" ? "bg-blue-100 text-blue-700" :
                    o.status === "PREPARING" ? "bg-amber-100 text-amber-700" :
                    o.status === "READY" ? "bg-green-100 text-green-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>{ORDER_STATUS_FR[o.status] || o.status}</span>
                </div>
                <span className="text-xs font-bold text-gray-700">{formatDA(o.total)}</span>
              </div>
            ))}
            {table.activeOrders.length > 2 && (
              <p className="text-xs text-gray-400">+{table.activeOrders.length - 2} autre(s)</p>
            )}
          </div>
        )}

        {/* Waiter requests */}
        {pendingReqs.length > 0 && (
          <div className="space-y-1">
            {pendingReqs.map((r) => (
              <div key={r.id} className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold border ${
                r.type === "REQUEST_BILL" ? "bg-purple-100 text-purple-700 border-purple-200" :
                r.type === "HELP" ? "bg-red-100 text-red-700 border-red-200" :
                "bg-amber-100 text-amber-700 border-amber-200"
              }`}>
                <span>{REQ_TYPE_LABEL[r.type] || r.type}</span>
                <span className="opacity-75">{timeAgo(r.createdAt)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-200/50">
          {totalRevenue > 0 ? (
            <div className="flex items-center gap-1.5">
              <Users className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500 font-semibold">{formatDA(totalRevenue)}</span>
            </div>
          ) : (
            <span className="text-xs text-gray-400">—</span>
          )}
          <span className="text-xs text-orange-500 font-semibold hover:text-orange-600">Détail →</span>
        </div>
      </div>
    </Link>
  );
}

export function OperationalTablesClient({
  initialTables,
  restaurantSlug,
}: {
  initialTables: OperationalTable[];
  restaurantSlug: string;
}) {
  const [tables, setTables] = useState(initialTables);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | TableStatus>("all");
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tables/operational");
      if (res.ok) { setTables(await res.json()); setLastRefresh(new Date()); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [refresh]);

  const statuses = tables.map(deriveStatus);
  const counts = {
    LIBRE: statuses.filter((s) => s === "LIBRE").length,
    OCCUPEE: statuses.filter((s) => s === "OCCUPEE").length,
    SERVICE: statuses.filter((s) => s === "SERVICE").length,
    ADDITION: statuses.filter((s) => s === "ADDITION").length,
  };

  const filtered = filter === "all" ? tables : tables.filter((t) => deriveStatus(t) === filter);

  return (
    <div>
      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {([
          { key: "all",      label: "Toutes",   value: tables.length, color: "text-gray-700",   bg: filter === "all" ? "bg-gray-900 text-white" : "bg-white" },
          { key: "OCCUPEE",  label: "Occupées",  value: counts.OCCUPEE,  color: "text-blue-600",   bg: filter === "OCCUPEE" ? "bg-blue-600 text-white" : "bg-blue-50" },
          { key: "SERVICE",  label: "Appel",     value: counts.SERVICE,  color: "text-amber-600",  bg: filter === "SERVICE" ? "bg-amber-500 text-white" : "bg-amber-50" },
          { key: "ADDITION", label: "Addition",  value: counts.ADDITION, color: "text-purple-600", bg: filter === "ADDITION" ? "bg-purple-600 text-white" : "bg-purple-50" },
        ] as { key: "all" | TableStatus; label: string; value: number; color: string; bg: string }[]).map((s) => (
          <button
            key={s.key}
            onClick={() => setFilter(s.key)}
            className={`rounded-2xl p-4 text-center border border-transparent transition-all hover:shadow-sm ${s.bg}`}
          >
            <p className={`text-2xl font-black ${filter === s.key ? "" : s.color}`}>{s.value}</p>
            <p className={`text-xs font-semibold mt-0.5 ${filter === s.key ? "opacity-80" : "text-gray-500"}`}>{s.label}</p>
          </button>
        ))}
      </div>

      {/* Refresh bar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-gray-400 flex items-center gap-1.5">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse inline-block" />
          Mis à jour {lastRefresh.toLocaleTimeString("fr-DZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </p>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center">
          <p className="text-gray-400 font-semibold">Aucune table dans cette catégorie</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map((table) => (
            <TableCard key={table.id} table={table} restaurantSlug={restaurantSlug} />
          ))}
        </div>
      )}
    </div>
  );
}
