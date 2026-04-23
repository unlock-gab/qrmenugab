"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDA } from "@/lib/i18n";
import { getBranchId } from "@/components/dashboard/BranchSwitcher";

interface ReportData {
  period: string;
  startDate: string;
  summary: {
    totalOrders: number;
    paidOrders: number;
    unpaidOrders: number;
    grossRevenue: number;
    totalDiscount: number;
    netRevenue: number;
    avgOrderValue: number;
    waiterRequests: number;
    reservations: number;
    newCustomers: number;
  };
  topItems: { menuItemId: string; name: string; quantitySold: number; revenue: number }[];
  tableUsage: { tableId: string; tableNumber: string; orderCount: number }[];
  promoUsage: { code: string; usedCount: number; discountType: string; discountValue: number }[];
  branchBreakdown: { branchId: string; name: string; orderCount: number; revenue: number }[];
  orderTypeBreakdown: { orderType: string; count: number; revenue: number }[];
}

const PERIODS = [
  { value: "today", label: "Aujourd'hui" },
  { value: "week", label: "7 derniers jours" },
  { value: "month", label: "Ce mois" },
];

const ORDER_TYPE_LABELS: Record<string, string> = {
  DINE_IN: "Sur place",
  TAKEAWAY: "À emporter",
  DELIVERY: "Livraison",
};
const ORDER_TYPE_ICONS: Record<string, string> = { DINE_IN: "🍽️", TAKEAWAY: "🥡", DELIVERY: "🛵" };

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [period, setPeriod] = useState("today");
  const [loading, setLoading] = useState(true);
  const [branchId, setBranchIdState] = useState<string | null>(null);

  useEffect(() => {
    setBranchIdState(getBranchId());
    const handler = () => setBranchIdState(getBranchId());
    window.addEventListener("branchChanged", handler);
    return () => window.removeEventListener("branchChanged", handler);
  }, []);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period });
      if (branchId) params.set("branchId", branchId);
      const res = await fetch(`/api/reports?${params}`);
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  }, [period, branchId]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const s = data?.summary;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">📊 Rapports</h1>
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${period === p.value ? "bg-orange-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {s && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total commandes" value={s.totalOrders.toString()}
              sub={`${s.paidOrders} payées · ${s.unpaidOrders} impayées`} color="orange" />
            <StatCard label="Revenu net" value={formatDA(s.netRevenue)}
              sub={s.totalDiscount > 0 ? `Remise: ${formatDA(s.totalDiscount)}` : "Sans remise"} color="green" />
            <StatCard label="Panier moyen" value={formatDA(s.avgOrderValue)} sub="par commande" color="blue" />
            <StatCard label="Réservations" value={s.reservations.toString()}
              sub={`${s.waiterRequests} demandes · ${s.newCustomers} nouveaux clients`} color="violet" />
          </div>

          {/* Order type breakdown */}
          {data!.orderTypeBreakdown.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
              <h2 className="font-bold text-gray-900 mb-4">📦 Répartition par type de commande</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {data!.orderTypeBreakdown.map((t) => (
                  <div key={t.orderType} className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                    <span className="text-2xl">{ORDER_TYPE_ICONS[t.orderType] || "📋"}</span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{ORDER_TYPE_LABELS[t.orderType] || t.orderType}</p>
                      <p className="text-xs text-gray-500">{t.count} commandes</p>
                      <p className="text-xs font-bold text-orange-600">{formatDA(t.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Branch breakdown */}
          {data!.branchBreakdown.length > 1 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
              <h2 className="font-bold text-gray-900 mb-4">🏪 Performance par succursale</h2>
              <div className="space-y-3">
                {data!.branchBreakdown.map((b) => {
                  const maxRev = Math.max(...data!.branchBreakdown.map((x) => x.revenue), 1);
                  const pct = Math.round((b.revenue / maxRev) * 100);
                  return (
                    <div key={b.branchId}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-800">{b.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500">{b.orderCount} cmd</span>
                          <span className="text-sm font-bold text-gray-700">{formatDA(b.revenue)}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top items + Table usage */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-bold text-gray-900 mb-4">🏆 Articles les plus vendus</h2>
              {data!.topItems.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Aucune donnée</p>
              ) : (
                <div className="space-y-2">
                  {data!.topItems.map((item, i) => (
                    <div key={item.menuItemId} className="flex items-center gap-3">
                      <span className="w-5 h-5 bg-orange-100 text-orange-600 rounded-full text-xs flex items-center justify-center font-bold shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.quantitySold} vendus</p>
                      </div>
                      <span className="text-sm font-semibold text-gray-700">{formatDA(item.revenue)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-bold text-gray-900 mb-4">⊞ Tables les plus actives</h2>
              {data!.tableUsage.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Aucune donnée</p>
              ) : (
                <div className="space-y-2">
                  {data!.tableUsage.map((t) => {
                    const maxCount = data!.tableUsage[0]?.orderCount ?? 1;
                    const pct = Math.round((t.orderCount / maxCount) * 100);
                    return (
                      <div key={t.tableId}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700">Table {t.tableNumber}</span>
                          <span className="text-sm font-semibold text-gray-700">{t.orderCount} cmd</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Promo usage */}
          {data!.promoUsage.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-bold text-gray-900 mb-4">🏷️ Utilisation des codes promo</h2>
              <div className="space-y-2">
                {data!.promoUsage.map((p) => (
                  <div key={p.code} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">{p.code}</span>
                    <span className="text-sm text-gray-600">
                      {p.discountType === "PERCENTAGE" ? `${p.discountValue}%` : formatDA(p.discountValue)}
                    </span>
                    <span className="text-sm text-gray-500">{p.usedCount} utilisation(s)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  const colors: Record<string, string> = {
    orange: "text-orange-500", green: "text-green-600",
    blue: "text-blue-600", violet: "text-violet-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${colors[color]}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}
