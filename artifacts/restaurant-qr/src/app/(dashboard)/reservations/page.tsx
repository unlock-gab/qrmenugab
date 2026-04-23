"use client";

import { useCallback, useEffect, useState } from "react";

interface Reservation {
  id: string;
  customerName: string;
  phone: string;
  reservationDate: string;
  guestCount: number;
  notes: string | null;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "معلّق",
  CONFIRMED: "مؤكد",
  CANCELLED: "ملغي",
  COMPLETED: "مكتمل",
};
const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  COMPLETED: "bg-blue-100 text-blue-700",
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [restaurantId, setRestaurantId] = useState("");
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    reservationDate: "",
    guestCount: "2",
    notes: "",
  });

  const fetchReservations = useCallback(async () => {
    try {
      const url = filter !== "all" ? `/api/reservations?status=${filter}` : "/api/reservations";
      const res = await fetch(url);
      if (res.ok) setReservations(await res.json());
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchReservations(); }, [fetchReservations]);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((d) => {
      if (d?.id) setRestaurantId(d.id);
    });
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    await fetch(`/api/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdating(null);
    fetchReservations();
  };

  const deleteReservation = async (id: string) => {
    if (!confirm("حذف هذا الحجز؟")) return;
    await fetch(`/api/reservations/${id}`, { method: "DELETE" });
    fetchReservations();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantId,
        customerName: form.customerName,
        phone: form.phone,
        reservationDate: form.reservationDate,
        guestCount: parseInt(form.guestCount),
        notes: form.notes || undefined,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setShowForm(false);
      setForm({ customerName: "", phone: "", reservationDate: "", guestCount: "2", notes: "" });
      fetchReservations();
    }
  };

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const counts = {
    PENDING: reservations.filter((r) => r.status === "PENDING").length,
    CONFIRMED: reservations.filter((r) => r.status === "CONFIRMED").length,
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الحجوزات</h1>
          <p className="text-sm text-gray-500 mt-1">
            {counts.PENDING > 0 && <span className="text-amber-600 font-medium">{counts.PENDING} معلّق</span>}
            {counts.PENDING > 0 && counts.CONFIRMED > 0 && " · "}
            {counts.CONFIRMED > 0 && <span className="text-green-600 font-medium">{counts.CONFIRMED} مؤكد</span>}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium"
        >
          + حجز يدوي
        </button>
      </div>

      <div className="flex gap-2 mb-5">
        {["all", "PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === s ? "bg-orange-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            {s === "all" ? "الكل" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b">
              <h2 className="text-lg font-bold text-gray-900">حجز يدوي</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اسم العميل *</label>
                  <input
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف *</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ والوقت *</label>
                  <input
                    type="datetime-local"
                    value={form.reservationDate}
                    onChange={(e) => setForm({ ...form, reservationDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">عدد الأشخاص *</label>
                  <input
                    type="number"
                    value={form.guestCount}
                    onChange={(e) => setForm({ ...form, guestCount: e.target.value })}
                    min="1"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-xl text-sm">إلغاء</button>
                <button type="submit" disabled={saving} className="flex-1 bg-orange-500 text-white px-4 py-2.5 rounded-xl text-sm disabled:opacity-50">{saving ? "..." : "حفظ"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {reservations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <div className="text-4xl mb-3">📅</div>
          <h3 className="font-semibold text-gray-700 mb-1">لا توجد حجوزات</h3>
          <p className="text-sm text-gray-400">ستظهر هنا الحجوزات من العملاء والإدخال اليدوي</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-bold text-gray-900">{r.customerName}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status]}`}>
                      {STATUS_LABELS[r.status]}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600 space-y-1">
                    <p>📅 {formatDate(r.reservationDate)}</p>
                    <p>👥 {r.guestCount} أشخاص &nbsp;·&nbsp; 📞 {r.phone}</p>
                    {r.notes && <p className="text-gray-500">💬 {r.notes}</p>}
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {r.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => updateStatus(r.id, "CONFIRMED")}
                        disabled={updating === r.id}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
                      >
                        تأكيد
                      </button>
                      <button
                        onClick={() => updateStatus(r.id, "CANCELLED")}
                        disabled={updating === r.id}
                        className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
                      >
                        إلغاء
                      </button>
                    </>
                  )}
                  {r.status === "CONFIRMED" && (
                    <button
                      onClick={() => updateStatus(r.id, "COMPLETED")}
                      disabled={updating === r.id}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
                    >
                      مكتمل
                    </button>
                  )}
                  <button
                    onClick={() => deleteReservation(r.id)}
                    className="text-red-400 hover:text-red-600 text-xs px-3 py-1.5"
                  >
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
