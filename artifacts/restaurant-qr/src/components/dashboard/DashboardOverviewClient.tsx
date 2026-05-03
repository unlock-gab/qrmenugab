"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDA } from "@/lib/i18n";

interface OrderItem { nameSnapshot: string; quantity: number; }
interface RecentOrder {
  id: string; orderNumber: string; status: string; total: number; createdAt: string;
  orderType?: string | null; customerName?: string | null;
  table?: { tableNumber: string } | null;
  branch?: { name: string } | null;
  orderItems: OrderItem[];
}
interface Stats {
  tableCount: number; menuItemCount: number;
  newOrders: number; preparingOrders: number; readyOrders: number;
  todayRevenue: number; totalOrdersToday: number; servedPaidToday: number; unpaidOrders: number;
  pendingReservations: number; todayReservations: number; activeWaiterRequests: number;
  recentOrders: RecentOrder[];
  restaurant?: { name: string; currency: string } | null;
}

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  NEW:       { label: "Nouveau",  badge: "bg-blue-100 text-blue-700" },
  PREPARING: { label: "En cours", badge: "bg-amber-100 text-amber-700" },
  READY:     { label: "Prêt",     badge: "bg-green-100 text-green-700" },
  SERVED:    { label: "Servi",    badge: "bg-gray-100 text-gray-600" },
  PAID:      { label: "Payé",     badge: "bg-purple-100 text-purple-700" },
  CANCELLED: { label: "Annulé",   badge: "bg-red-100 text-red-600" },
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

function StatCard({ value, label, href, textColor, iconBg, icon, sub, urgent, accent }: {
  value: number | string; label: string; href?: string; textColor: string;
  iconBg: string; icon: string; sub?: string; urgent?: boolean; accent?: string;
}) {
  const inner = (
    <div className={`relative bg-white rounded-2xl p-5 border transition-all overflow-hidden group ${
      urgent
        ? "border-red-200 shadow-md shadow-red-50/50"
        : "border-gray-100 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/50 hover:-translate-y-0.5"
    }`}>
      {accent && (
        <div className={`absolute top-0 left-0 right-0 h-0.5 ${accent}`} />
      )}
      <div className="flex items-start justify-between mb-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${iconBg} ${urgent ? "animate-pulse" : ""}`}>
          {icon}
        </div>
        {urgent && (
          <span className="flex items-center gap-1 text-xs text-red-500 font-semibold bg-red-50 border border-red-100 px-2 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
            Urgent
          </span>
        )}
      </div>
      <p className={`text-3xl font-black leading-none ${textColor}`}>{value}</p>
      <p className="text-sm font-medium text-gray-500 mt-1.5">{label}</p>
      {sub && <p className="mt-2 text-xs text-gray-400">{sub}</p>}
    </div>
  );
  return href ? <Link href={href} className="block">{inner}</Link> : inner;
}

function SkeletonDashboard() {
  return (
    <div className="p-6 max-w-6xl animate-pulse space-y-6">
      <div className="h-9 w-64 bg-gray-100 rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}
      </div>
      <div className="h-64 bg-gray-100 rounded-2xl" />
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

export function DashboardOverviewClient() {
  const [stats, setStats] = useState<Stats | null>(null);

  const fetchStats = () => {
    fetch("/api/dashboard/stats").then((r) => r.json()).then(setStats).catch(() => {});
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return <SkeletonDashboard />;

  const activeCount = stats.newOrders + stats.preparingOrders + stats.readyOrders;

  return (
    <div className="p-6 max-w-6xl space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">
            {getGreeting()}{stats.restaurant?.name ? `, ${stats.restaurant.name}` : ""} 👋
          </h1>
          <p className="text-gray-400 text-sm mt-0.5 capitalize">
            {new Date().toLocaleDateString("fr-DZ", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-2.5 shadow-sm">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-gray-600">En direct</span>
        </div>
      </div>

      {/* Main KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          value={stats.newOrders}
          label="Nouvelles commandes"
          href="/merchant/orders?filter=NEW"
          textColor="text-blue-600"
          iconBg="bg-blue-50"
          icon="🔔"
          sub={stats.newOrders === 0 ? "Aucune en attente" : `${stats.newOrders} à traiter`}
          urgent={stats.newOrders > 0}
          accent={stats.newOrders > 0 ? "bg-blue-500" : undefined}
        />
        <StatCard
          value={stats.preparingOrders}
          label="En préparation"
          href="/merchant/orders?filter=PREPARING"
          textColor="text-amber-600"
          iconBg="bg-amber-50"
          icon="👨‍🍳"
          sub="En cuisine"
          accent="bg-amber-400"
        />
        <StatCard
          value={stats.readyOrders}
          label="Prêtes à servir"
          href="/merchant/orders?filter=READY"
          textColor="text-emerald-600"
          iconBg="bg-emerald-50"
          icon="✅"
          sub="À récupérer"
          accent={stats.readyOrders > 0 ? "bg-emerald-500" : undefined}
        />
        <StatCard
          value={formatDA(stats.todayRevenue)}
          label="Chiffre d'affaires"
          textColor="text-gray-900"
          iconBg="bg-violet-50"
          icon="💰"
          sub={`${stats.servedPaidToday} commandes payées`}
          accent="bg-violet-500"
        />
      </div>

      {/* Secondary stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-2xl font-black text-gray-900">{stats.totalOrdersToday}</p>
          <p className="text-sm text-gray-500 mt-1">Commandes aujourd&apos;hui</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-2xl font-black text-gray-900">{stats.tableCount}</p>
          <p className="text-sm text-gray-500 mt-1">Tables actives</p>
        </div>
        <Link
          href="/merchant/cashier"
          className={`bg-white rounded-2xl p-4 border shadow-sm hover:shadow-md transition-all block ${
            stats.unpaidOrders > 0 ? "border-red-200 hover:border-red-300" : "border-gray-100 hover:border-gray-200"
          }`}
        >
          <p className={`text-2xl font-black ${stats.unpaidOrders > 0 ? "text-red-600" : "text-gray-900"}`}>
            {stats.unpaidOrders}
          </p>
          <p className="text-sm text-gray-500 mt-1">Commandes impayées</p>
          {stats.unpaidOrders > 0 && (
            <span className="text-xs text-red-500 font-semibold mt-1 block">→ Aller à la caisse</span>
          )}
        </Link>
      </div>

      {/* Operational alerts */}
      {(stats.activeWaiterRequests > 0 || stats.pendingReservations > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stats.activeWaiterRequests > 0 && (
            <Link
              href="/merchant/service"
              className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 flex items-center gap-4 hover:bg-amber-100 hover:border-amber-400 transition-all"
            >
              <div className="w-12 h-12 bg-amber-400 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-md shadow-amber-200 animate-pulse">
                🔔
              </div>
              <div>
                <p className="text-2xl font-black text-amber-900">{stats.activeWaiterRequests}</p>
                <p className="font-bold text-amber-800 text-sm">
                  Demande{stats.activeWaiterRequests > 1 ? "s" : ""} de service active{stats.activeWaiterRequests > 1 ? "s" : ""}
                </p>
                <p className="text-xs text-amber-600 mt-0.5">Appuyez pour traiter →</p>
              </div>
            </Link>
          )}
          {stats.pendingReservations > 0 && (
            <Link
              href="/merchant/reservations"
              className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5 flex items-center gap-4 hover:bg-blue-100 hover:border-blue-300 transition-all"
            >
              <div className="w-12 h-12 bg-blue-400 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-md shadow-blue-200">
                📅
              </div>
              <div>
                <p className="text-2xl font-black text-blue-900">{stats.pendingReservations}</p>
                <p className="font-bold text-blue-800 text-sm">
                  Réservation{stats.pendingReservations > 1 ? "s" : ""} en attente
                </p>
                {stats.todayReservations > 0 && (
                  <p className="text-xs text-blue-600 mt-0.5">
                    {stats.todayReservations} confirmée{stats.todayReservations > 1 ? "s" : ""} aujourd&apos;hui
                  </p>
                )}
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Operational shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/merchant/kitchen"
          className="flex items-center gap-3 bg-gray-900 hover:bg-gray-800 rounded-2xl p-4 transition-all group"
        >
          <div className="w-10 h-10 bg-gray-800 group-hover:bg-gray-700 rounded-xl flex items-center justify-center text-xl shrink-0 transition-colors">
            🍳
          </div>
          <div>
            <p className="text-white font-bold text-sm">Cuisine</p>
            <p className="text-gray-400 text-xs">{stats.newOrders + stats.preparingOrders} actives</p>
          </div>
        </Link>

        <Link
          href="/merchant/service"
          className={`flex items-center gap-3 rounded-2xl p-4 transition-all group ${
            stats.activeWaiterRequests > 0
              ? "bg-amber-500 hover:bg-amber-600"
              : "bg-amber-50 hover:bg-amber-100 border border-amber-100"
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
            stats.activeWaiterRequests > 0 ? "bg-amber-400" : "bg-amber-100"
          }`}>
            🔔
          </div>
          <div>
            <p className={`font-bold text-sm ${stats.activeWaiterRequests > 0 ? "text-white" : "text-amber-800"}`}>
              Service
            </p>
            <p className={`text-xs ${stats.activeWaiterRequests > 0 ? "text-amber-100" : "text-amber-500"}`}>
              {stats.activeWaiterRequests} demande{stats.activeWaiterRequests !== 1 ? "s" : ""}
            </p>
          </div>
        </Link>

        <Link
          href="/merchant/waiter"
          className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 rounded-2xl p-4 transition-all group"
        >
          <div className="w-10 h-10 bg-blue-500 group-hover:bg-blue-600 rounded-xl flex items-center justify-center text-xl shrink-0 transition-colors">
            🍽️
          </div>
          <div>
            <p className="text-white font-bold text-sm">Serveur</p>
            <p className="text-blue-200 text-xs">{stats.readyOrders} prêtes</p>
          </div>
        </Link>

        <Link
          href="/merchant/cashier"
          className="flex items-center gap-3 bg-violet-600 hover:bg-violet-700 rounded-2xl p-4 transition-all group"
        >
          <div className="w-10 h-10 bg-violet-500 group-hover:bg-violet-600 rounded-xl flex items-center justify-center text-xl shrink-0 transition-colors">
            💰
          </div>
          <div>
            <p className="text-white font-bold text-sm">Caisse</p>
            <p className="text-violet-200 text-xs">{stats.unpaidOrders} impayées</p>
          </div>
        </Link>
      </div>

      {/* Recent active orders */}
      {stats.recentOrders.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
            <div>
              <h2 className="font-bold text-gray-900">Commandes actives</h2>
              <p className="text-xs text-gray-400 mt-0.5">{activeCount} commande{activeCount !== 1 ? "s" : ""} à traiter</p>
            </div>
            <Link href="/merchant/orders" className="text-sm text-orange-500 hover:text-orange-600 font-bold transition-colors">
              Voir tout →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.recentOrders.map((order) => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.NEW;
              return (
                <div key={order.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-gray-900">#{order.orderNumber}</span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                      {order.orderType && ORDER_TYPE_ICON[order.orderType] && (
                        <span className="text-xs">{ORDER_TYPE_ICON[order.orderType]}</span>
                      )}
                      {order.branch && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          {order.branch.name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {order.table ? `🪑 Table ${order.table.tableNumber}` : order.customerName || "—"}
                      {" · "}
                      {order.orderItems.slice(0, 2).map((i) => `${i.quantity}× ${i.nameSnapshot}`).join(", ")}
                      {order.orderItems.length > 2 ? ` +${order.orderItems.length - 2} autres` : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-sm text-gray-900">{formatDA(order.total)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo(order.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl">✅</span>
          </div>
          <p className="text-gray-700 font-semibold">Aucune commande active</p>
          <p className="text-gray-400 text-sm mt-1">Les nouvelles commandes apparaîtront ici automatiquement</p>
        </div>
      )}
    </div>
  );
}
