"use client";

import { useCallback, useEffect, useState } from "react";

interface PromoCode {
  id: string;
  code: string;
  discountType: "FIXED" | "PERCENTAGE";
  discountValue: number;
  minimumOrderAmount: number | null;
  usageLimit: number | null;
  usedCount: number;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  createdAt: string;
}

const DISCOUNT_AR: Record<string, string> = { FIXED: "مبلغ ثابت", PERCENTAGE: "نسبة %" };

export default function PromosPage() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    code: "",
    discountType: "PERCENTAGE" as "FIXED" | "PERCENTAGE",
    discountValue: "",
    minimumOrderAmount: "",
    usageLimit: "",
    startsAt: "",
    endsAt: "",
  });

  const fetchPromos = useCallback(async () => {
    try {
      const res = await fetch("/api/promo-codes");
      if (res.ok) setPromos(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPromos(); }, [fetchPromos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code.toUpperCase(),
          discountType: form.discountType,
          discountValue: parseFloat(form.discountValue),
          minimumOrderAmount: form.minimumOrderAmount ? parseFloat(form.minimumOrderAmount) : undefined,
          usageLimit: form.usageLimit ? parseInt(form.usageLimit) : undefined,
          startsAt: form.startsAt || undefined,
          endsAt: form.endsAt || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "خطأ في الحفظ");
      } else {
        setShowForm(false);
        setForm({ code: "", discountType: "PERCENTAGE", discountValue: "", minimumOrderAmount: "", usageLimit: "", startsAt: "", endsAt: "" });
        fetchPromos();
      }
    } finally { setSaving(false); }
  };

  const toggleActive = async (id: string, current: boolean) => {
    await fetch(`/api/promo-codes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    fetchPromos();
  };

  const deletePromo = async (id: string) => {
    if (!confirm("حذف هذا الكود؟")) return;
    await fetch(`/api/promo-codes/${id}`, { method: "DELETE" });
    fetchPromos();
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">كودات الخصم</h1>
          <p className="text-sm text-gray-500 mt-1">{promos.length} كود</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          + إضافة كود
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b">
              <h2 className="text-lg font-bold text-gray-900">كود خصم جديد</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الكود *</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="SUMMER20"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm uppercase font-mono"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">نوع الخصم *</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value as "FIXED" | "PERCENTAGE" })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm"
                  >
                    <option value="PERCENTAGE">نسبة %</option>
                    <option value="FIXED">مبلغ ثابت</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    القيمة * {form.discountType === "PERCENTAGE" ? "(%)" : ""}
                  </label>
                  <input
                    type="number"
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                    min="0"
                    max={form.discountType === "PERCENTAGE" ? "100" : undefined}
                    step="0.01"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الحد الأدنى للطلب</label>
                  <input
                    type="number"
                    value={form.minimumOrderAmount}
                    onChange={(e) => setForm({ ...form, minimumOrderAmount: e.target.value })}
                    min="0"
                    step="0.01"
                    placeholder="اختياري"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">حد الاستخدام</label>
                  <input
                    type="number"
                    value={form.usageLimit}
                    onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                    min="1"
                    placeholder="غير محدود"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ البدء</label>
                  <input
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الانتهاء</label>
                  <input
                    type="datetime-local"
                    value={form.endsAt}
                    onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
                >
                  {saving ? "..." : "حفظ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {promos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <div className="text-4xl mb-3">🏷️</div>
          <h3 className="font-semibold text-gray-700 mb-1">لا توجد كودات خصم</h3>
          <p className="text-sm text-gray-400">أضف كود خصم لتحفيز العملاء</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-right px-5 py-3 font-semibold text-gray-600">الكود</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">الخصم</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">الاستخدام</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">الانتهاء</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">الحالة</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {promos.map((promo) => (
                <tr key={promo.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-4">
                    <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-lg">
                      {promo.code}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-700">
                    {promo.discountType === "PERCENTAGE"
                      ? `${promo.discountValue}%`
                      : promo.discountValue.toFixed(2)}
                    {" — "}{DISCOUNT_AR[promo.discountType]}
                    {promo.minimumOrderAmount && (
                      <span className="text-xs text-gray-400 block">
                        الحد الأدنى: {promo.minimumOrderAmount}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {promo.usedCount}
                    {promo.usageLimit ? ` / ${promo.usageLimit}` : ""}
                    <span className="text-gray-400"> مرة</span>
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-xs">
                    {promo.endsAt ? new Date(promo.endsAt).toLocaleDateString("ar-SA") : "—"}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => toggleActive(promo.id, promo.isActive)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${promo.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                    >
                      {promo.isActive ? "نشط" : "معطّل"}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => deletePromo(promo.id)}
                      className="text-red-400 hover:text-red-600 text-xs"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
