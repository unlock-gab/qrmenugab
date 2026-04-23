"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDA } from "@/lib/i18n";

interface OrderItem { nameSnapshot: string; quantity: number; }
interface RecentOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  orderType?: string | null;
  customerName?: string | null;
  table?: { tableNumber: string } | null;
  branch?: { name: string } | null;
  orderItems: OrderItem[];
}
interface Stats {
  tableCount: number;
  menuItemCount: number;
  newOrders: number;
  preparingOrders: number;
  readyOrders: number;
  todayRevenue: number;
  totalOrdersToday: number;
  servedPaidToday: number;
  unpaidOrders: number;
  recentOrders: RecentOrder[];
  restaurant?: { name: string; currency: string } | null;
}

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  NEW:       { label: "Nouveau",      badge: "bg-blue-100 text-blue-700" },
  PREPARING: { label: "En cours",     badge: "bg-amber-100 text-amber-700" },
  READY:     { label: "Prêt",         badge: "bg-green-100 text-green-700" },
  SERVED:    { label: "Servi",        badge: "bg-gray-100 text-gray-600" },
  PAID:      { label: "Payé",         badge: "bg-purple-100 text-purple-700" },
  CANCELLED: { label: "Annulé",       badge: "bg-red-100 text-red-600" },
};

const ORDER_TYPE_ICON: Record<string, string> = {
  DINE_IN: "🍽️", TAKEAWAY: "🥡", DELIVERY: "🛵",
};

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)} min`;
  return new Date(iso).toLocaleTimeString("fr-DZ", { hour: "2-digit", minute: "2-digit" });
}

function StatCard({
  value, label, href, color, icon, sub, urgent,
}: {
  value: number | string; label: string; href?: string; color: string;
  icon: string; sub?: string; urgent?: boolean;
}) {
  const inner = (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border transition-all ${urgent ? "border-red-200 shadow-red-50" : "border-gray-100 hover:border-gray-200 hover:shadow-md"}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-3xl font-black ${color}`}>{value}</p>
          <p className="text-sm font-medium text-gray-600 mt-1">{label}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${urgent ? "bg-red-50" : "bg-gray-50"}`}>
          {icon}
        </div>
      </div>
      {sub && <p className="mt-3 text-xs text-gray-400">{sub}</p>}
      {urgent && <span className="mt-2 inline-flex items-center gap-1 text-xs text-red-500 font-medium"><span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />Attention requise</span>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function SkeletonDashboard() {
  return (
    <div className="p-6 max-w-6xl animate-pulse space-y-6">
      <div className="h-8 w-56 bg-gray-100 rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}
      </div>
      <div className="h-64 bg-gray-100 rounded-2xl" />
    </div>
  );
}

export function DashboardOverviewClient() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});

    const interval = setInterval(() => {
      fetch("/api/dashboard/stats")
        .then((r) => r.json())
        .then(setStats)
        .catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return <SkeletonDashboard />;

  const activeCount = stats.newOrders + stats.preparingOrders + stats.readyOrders;

  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{stats.restaurant?.name || "Tableau de bord"}</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          {new Date().toLocaleDateString("fr-DZ", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Main KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard value={stats.newOrders} label="Nouvelles commandes" href="/orders?filter=NEW"
          color="text-blue-600" icon="🔔"
          sub={stats.newOrders === 0 ? "Aucune en attente" : undefined}
          urgent={stats.newOrders > 0} />
        <StatCard value={stats.preparingOrders} label="En préparation" href="/orders?filter=PREPARING"
          color="text-amber-600" icon="👨‍🍳" sub="En cuisine" />
        <StatCard value={stats.readyOrders} label="Prêtes à servir" href="/orders?filter=READY"
          color="text-emerald-600" icon="✅" sub="À récupérer" />
        <StatCard value={formatDA(stats.todayRevenue)} label="Chiffre d'affaires" icon="💰"
          color="text-gray-900" sub={`${stats.servedPaidToday} commandes payées`} />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-2xl font-bold text-gray-900">{stats.totalOrdersToday}</p>
          <p className="text-sm text-gray-500 mt-0.5">Commandes aujourd'hui</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-2xl font-bold text-gray-900">{stats.tableCount}</p>
          <p className="text-sm text-gray-500 mt-0.5">Tables actives</p>
        </div>
        <Link href="/cashier" className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-red-200 hover:shadow-md transition-all block">
          <p className={`text-2xl font-bold ${stats.unpaidOrders > 0 ? "text-red-600" : "text-gray-900"}`}>
            {stats.unpaidOrders}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">Commandes impayées</p>
          {stats.unpaidOrders > 0 && <span className="text-xs text-red-500 font-medium">→ Caisse</span>}
        </Link>
      </div>

      {/* Operational shortcuts */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Link href="/kitchen" className="flex items-center gap-3 bg-gray-900 hover:bg-gray-800 rounded-2xl p-4 transition-all">
          <span className="text-2xl">🍳</span>
          <div>
            <p className="text-white font-semibold text-sm">Cuisine</p>
            <p className="text-gray-400 text-xs">{stats.newOrders + stats.preparingOrders} actives</p>
          </div>
        </Link>
        <Link href="/waiter" className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 rounded-2xl p-4 transition-all">
          <span className="text-2xl">🍽️</span>
          <div>
            <p className="text-white font-semibold text-sm">Serveur</p>
            <p className="text-blue-200 text-xs">{stats.readyOrders} prêtes</p>
          </div>
        </Link>
        <Link href="/cashier" className="flex items-center gap-3 bg-violet-600 hover:bg-violet-700 rounded-2xl p-4 transition-all">
          <span className="text-2xl">💰</span>
          <div>
            <p className="text-white font-semibold text-sm">Caisse</p>
            <p className="text-violet-200 text-xs">{stats.unpaidOrders} impayées</p>
          </div>
        </Link>
      </div>

      {/* Recent active orders */}
      {stats.recentOrders.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Commandes actives</h2>
              <p className="text-xs text-gray-400 mt-0.5">{activeCount} commande{activeCount > 1 ? "s" : ""} à traiter</p>
            </div>
            <Link href="/orders" className="text-sm text-orange-500 hover:text-orange-600 font-semibold">
              Voir tout →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.recentOrders.map((order) => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.NEW;
              return (
                <div key={order.id} className="px-6 py-3.5 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900">#{order.orderNumber}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>{cfg.label}</span>
                      {order.orderType && ORDER_TYPE_ICON[order.orderType] && (
                        <span className="text-xs">{ORDER_TYPE_ICON[order.orderType]}</span>
                      )}
                      {order.branch && <span className="text-xs text-gray-400">· {order.branch.name}</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {order.table ? `Table ${order.table.tableNumber}` : order.customerName || "—"}
                      {" · "}
                      {order.orderItems.slice(0, 2).map((i) => `${i.quantity}× ${i.nameSnapshot}`).join(", ")}
                      {order.orderItems.length > 2 ? ` +${order.orderItems.length - 2}` : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm text-gray-900">{formatDA(order.total)}</p>
                    <p className="text-xs text-gray-400">{timeAgo(order.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-gray-500 font-medium">Aucune commande active pour l'instant</p>
          <p className="text-gray-400 text-sm mt-1">Les nouvelles commandes apparaîtront ici automatiquement</p>
        </div>
      )}
    </div>
  );
}
