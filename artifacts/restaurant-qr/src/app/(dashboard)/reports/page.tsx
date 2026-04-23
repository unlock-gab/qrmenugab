"use client";

import { useCallback, useEffect, useState } from "react";

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
  };
  topItems: { menuItemId: string; name: string; quantitySold: number; revenue: number }[];
  tableUsage: { tableId: string; tableNumber: string; orderCount: number }[];
  promoUsage: { code: string; usedCount: number; discountType: string; discountValue: number }[];
}

const PERIODS = [
  { value: "today", label: "اليوم" },
  { value: "week", label: "آخر 7 أيام" },
  { value: "month", label: "هذا الشهر" },
];

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [period, setPeriod] = useState("today");
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState("USD");

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?period=${period}`);
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  }, [period]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((d) => {
      if (d?.currency) setCurrency(d.currency);
    });
  }, []);

  function fmt(n: number) { return n.toFixed(2); }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const s = data?.summary;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">التقارير</h1>
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${period === p.value ? "bg-orange-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {s && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="إجمالي الطلبات" value={s.totalOrders.toString()} sub={`${s.paidOrders} مدفوع · ${s.unpaidOrders} غير مدفوع`} color="orange" />
            <StatCard label="الإيراد الصافي" value={`${fmt(s.netRevenue)} ${currency}`} sub={s.totalDiscount > 0 ? `خصم: ${fmt(s.totalDiscount)}` : "بدون خصم"} color="green" />
            <StatCard label="متوسط الطلب" value={`${fmt(s.avgOrderValue)} ${currency}`} sub="لكل طلب" color="blue" />
            <StatCard label="الحجوزات" value={s.reservations.toString()} sub={`${s.waiterRequests} طلب نادل`} color="violet" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-bold text-gray-900 mb-4">🏆 أكثر الأصناف مبيعاً</h2>
              {data!.topItems.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">لا توجد بيانات</p>
              ) : (
                <div className="space-y-2">
                  {data!.topItems.map((item, i) => (
                    <div key={item.menuItemId} className="flex items-center gap-3">
                      <span className="w-5 h-5 bg-orange-100 text-orange-600 rounded-full text-xs flex items-center justify-center font-bold shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.quantitySold} قطعة</p>
                      </div>
                      <span className="text-sm font-semibold text-gray-700">{fmt(item.revenue)} {currency}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-bold text-gray-900 mb-4">⊞ أكثر الطاولات نشاطاً</h2>
              {data!.tableUsage.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">لا توجد بيانات</p>
              ) : (
                <div className="space-y-2">
                  {data!.tableUsage.map((t, i) => {
                    const maxCount = data!.tableUsage[0]?.orderCount ?? 1;
                    const pct = Math.round((t.orderCount / maxCount) * 100);
                    return (
                      <div key={t.tableId}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700">طاولة {t.tableNumber}</span>
                          <span className="text-sm font-semibold text-gray-700">{t.orderCount} طلب</span>
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

          {data!.promoUsage.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-bold text-gray-900 mb-4">🏷️ استخدام كودات الخصم</h2>
              <div className="space-y-2">
                {data!.promoUsage.map((p) => (
                  <div key={p.code} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">{p.code}</span>
                    <span className="text-sm text-gray-600">
                      {p.discountType === "PERCENTAGE" ? `${p.discountValue}%` : `${p.discountValue} ${currency}`}
                    </span>
                    <span className="text-sm text-gray-500">{p.usedCount} استخدام</span>
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
    orange: "bg-orange-50 text-orange-500",
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
    violet: "bg-violet-50 text-violet-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${colors[color].split(" ")[1]}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}
