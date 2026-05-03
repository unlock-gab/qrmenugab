"use client";

import { useCallback, useEffect, useState } from "react";
import { Calendar, Clock, Users, Phone, CheckCircle, XCircle, RotateCcw, Plus, Filter } from "lucide-react";

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

const STATUS_CONFIG: Record<string, { label: string; badge: string; dot: string }> = {
  PENDING:   { label: "En attente",  badge: "bg-amber-50 text-amber-700 border-amber-200",   dot: "bg-amber-400" },
  CONFIRMED: { label: "Confirmée",   badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-400" },
  CANCELLED: { label: "Annulée",     badge: "bg-red-50 text-red-600 border-red-200",         dot: "bg-red-400" },
  COMPLETED: { label: "Terminée",    badge: "bg-gray-50 text-gray-600 border-gray-200",      dot: "bg-gray-400" },
};

const FILTER_LABELS: Record<string, string> = {
  all: "Toutes", PENDING: "En attente", CONFIRMED: "Confirmées",
  CANCELLED: "Annulées", COMPLETED: "Terminées",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return {
    date: d.toLocaleDateString("fr-DZ", { weekday: "short", day: "numeric", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("fr-DZ", { hour: "2-digit", minute: "2-digit" }),
    isToday: new Date().toDateString() === d.toDateString(),
    isFuture: d > new Date(),
  };
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diff < 60) return `il y a ${diff} min`;
  if (diff < 1440) return `il y a ${Math.floor(diff / 60)}h`;
  return `il y a ${Math.floor(diff / 1440)} jour${Math.floor(diff / 1440) > 1 ? "s" : ""}`;
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [restaurantId, setRestaurantId] = useState("");
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [form, setForm] = useState({
    customerName: "", phone: "",
    date: "", time: "19:00",
    guestCount: "2", notes: "",
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
    fetch("/api/settings").then((r) => r.json()).then((d) => { if (d?.id) setRestaurantId(d.id); });
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    await fetch(`/api/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdating(null);
    setSelected(null);
    fetchReservations();
  };

  const deleteReservation = async (id: string) => {
    if (!confirm("Supprimer cette réservation ?")) return;
    await fetch(`/api/reservations/${id}`, { method: "DELETE" });
    setSelected(null);
    fetchReservations();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const reservationDate = `${form.date}T${form.time}:00`;
    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantId,
        customerName: form.customerName,
        phone: form.phone,
        reservationDate,
        guestCount: parseInt(form.guestCount),
        notes: form.notes || undefined,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setShowForm(false);
      setForm({ customerName: "", phone: "", date: "", time: "19:00", guestCount: "2", notes: "" });
      fetchReservations();
    }
  };

  const counts = {
    PENDING: reservations.filter((r) => r.status === "PENDING").length,
    CONFIRMED: reservations.filter((r) => r.status === "CONFIRMED").length,
    total: reservations.length,
  };

  // Group by date
  const grouped = reservations.reduce((acc, r) => {
    const d = new Date(r.reservationDate).toLocaleDateString("fr-DZ", { weekday: "long", day: "numeric", month: "long" });
    if (!acc[d]) acc[d] = [];
    acc[d].push(r);
    return acc;
  }, {} as Record<string, Reservation[]>);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Réservations</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {counts.PENDING > 0 && <span className="text-amber-600 font-semibold">{counts.PENDING} en attente</span>}
            {counts.PENDING > 0 && counts.CONFIRMED > 0 && " · "}
            {counts.CONFIRMED > 0 && <span className="text-emerald-600 font-semibold">{counts.CONFIRMED} confirmées</span>}
            {counts.PENDING === 0 && counts.CONFIRMED === 0 && "Aucune réservation active"}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition"
        >
          <Plus className="w-4 h-4" /> Réservation manuelle
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: "En attente", value: counts.PENDING, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Confirmées", value: counts.CONFIRMED, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Annulées", value: reservations.filter((r) => r.status === "CANCELLED").length, color: "text-red-500", bg: "bg-red-50" },
          { label: "Total", value: counts.total, color: "text-gray-700", bg: "bg-gray-50" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <Filter className="w-4 h-4 text-gray-400" />
        {["all", "PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === s ? "bg-orange-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {FILTER_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reservations.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center">
          <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-semibold text-lg">Aucune réservation pour le moment</p>
          <p className="text-gray-400 text-sm mt-1">Les réservations clients et manuelles apparaîtront ici</p>
          <button onClick={() => setShowForm(true)} className="mt-5 bg-orange-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-orange-600 transition">
            + Ajouter une réservation
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> {date}
              </h2>
              <div className="space-y-2.5">
                {items.map((r) => {
                  const { time, isToday, isFuture } = formatDate(r.reservationDate);
                  const cfg = STATUS_CONFIG[r.status];
                  const isSelected = selected?.id === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelected(isSelected ? null : r)}
                      className={`bg-white rounded-2xl border cursor-pointer transition-all ${
                        isSelected ? "border-orange-300 shadow-md shadow-orange-50" : "border-gray-100 hover:border-gray-200 hover:shadow-sm"
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            {/* Time block */}
                            <div className="bg-gray-50 rounded-xl px-3 py-2 text-center shrink-0">
                              <p className="text-base font-black text-gray-900 leading-tight">{time}</p>
                              {isToday && <p className="text-xs text-orange-500 font-bold">Auj.</p>}
                            </div>
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-gray-900 text-sm">{r.customerName}</h3>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.badge}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                  {cfg.label}
                                </span>
                                {isToday && isFuture && r.status === "CONFIRMED" && (
                                  <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full font-semibold">Aujourd'hui</span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                  <Users className="w-3 h-3" /> {r.guestCount} pers.
                                </span>
                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                  <Phone className="w-3 h-3" /> {r.phone}
                                </span>
                                {r.notes && <span className="text-xs text-gray-400 italic line-clamp-1">"{r.notes}"</span>}
                              </div>
                              <p className="text-xs text-gray-400 mt-1">{timeAgo(r.createdAt)}</p>
                            </div>
                          </div>

                          {/* Quick actions (always visible on large, expandable) */}
                          <div className="flex gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {r.status === "PENDING" && (
                              <>
                                <button
                                  onClick={() => updateStatus(r.id, "CONFIRMED")}
                                  disabled={updating === r.id}
                                  className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition disabled:opacity-50"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" /> Confirmer
                                </button>
                                <button
                                  onClick={() => updateStatus(r.id, "CANCELLED")}
                                  disabled={updating === r.id}
                                  className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-xl text-xs font-bold transition disabled:opacity-50"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            {r.status === "CONFIRMED" && (
                              <button
                                onClick={() => updateStatus(r.id, "COMPLETED")}
                                disabled={updating === r.id}
                                className="flex items-center gap-1 bg-gray-700 hover:bg-gray-800 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition disabled:opacity-50"
                              >
                                <RotateCcw className="w-3.5 h-3.5" /> Terminée
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Expanded actions */}
                        {isSelected && (
                          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 flex-wrap">
                            {r.status === "CANCELLED" && (
                              <button onClick={() => updateStatus(r.id, "PENDING")} className="text-xs text-amber-600 hover:text-amber-700 font-semibold px-3 py-1.5 bg-amber-50 rounded-xl">
                                Remettre en attente
                              </button>
                            )}
                            <button onClick={() => deleteReservation(r.id)} className="text-xs text-red-400 hover:text-red-600 font-medium px-3 py-1.5 bg-red-50 rounded-xl ml-auto">
                              Supprimer
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manual booking modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-900">Nouvelle réservation manuelle</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nom du client *</label>
                  <input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-300" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Téléphone *</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-300" required />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date *</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-300" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Heure *</label>
                  <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-300" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nombre de personnes</label>
                <input type="number" value={form.guestCount} onChange={(e) => setForm({ ...form, guestCount: e.target.value })}
                  min="1" max="50" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Notes (optionnel)</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-orange-300" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-200 text-gray-600 px-4 py-3 rounded-2xl text-sm font-semibold hover:bg-gray-50 transition">
                  Annuler
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-2xl text-sm font-bold transition disabled:opacity-50">
                  {saving ? "Enregistrement…" : "Créer la réservation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
