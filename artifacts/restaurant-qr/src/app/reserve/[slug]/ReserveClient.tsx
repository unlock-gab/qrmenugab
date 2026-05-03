"use client";

import { useState } from "react";
import { CheckCircle2, Calendar, Users, Phone, User, Clock } from "lucide-react";

type Props = {
  restaurantId: string;
  restaurantName: string;
  logoUrl: string | null;
  primaryColor: string | null;
};

const TIME_SLOTS = ["11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"];

export function ReserveClient({ restaurantId, restaurantName, logoUrl, primaryColor }: Props) {
  const brand = primaryColor || "#f97316";
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    date: "",
    time: "",
    guestCount: 2,
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const set = (field: string, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date || !form.time) { setError("Veuillez sélectionner une date et une heure"); return; }
    setSubmitting(true); setError("");
    const reservationDate = `${form.date}T${form.time}:00`;
    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantId,
        customerName: form.customerName,
        phone: form.phone,
        reservationDate,
        guestCount: form.guestCount,
        notes: form.notes || undefined,
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      setSuccess(true);
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Erreur lors de l'envoi. Veuillez réessayer.");
    }
  };

  const reset = () => {
    setSuccess(false);
    setForm({ customerName: "", phone: "", date: "", time: "", guestCount: 2, notes: "" });
    setError("");
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm w-full bg-white rounded-3xl shadow-xl p-10 border border-gray-100">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Demande envoyée !</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            Votre demande de réservation a bien été reçue. <strong>{restaurantName}</strong> vous confirmera par téléphone.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-6 text-sm text-amber-800">
            📞 Gardez votre téléphone à portée de main pour la confirmation.
          </div>
          <button
            onClick={reset}
            style={{ background: brand }}
            className="w-full text-white py-3.5 rounded-2xl font-bold text-sm hover:opacity-90 transition"
          >
            Faire une autre réservation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${brand}, ${brand}cc)` }} className="py-8 px-4 text-center">
        {logoUrl ? (
          <img src={logoUrl} alt={restaurantName} className="w-16 h-16 rounded-2xl object-cover mx-auto mb-3 bg-white/20" />
        ) : (
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">🍽️</div>
        )}
        <h1 className="text-2xl font-black text-white">{restaurantName}</h1>
        <p className="text-white/80 text-sm mt-1">Réserver une table</p>
      </div>

      <div className="max-w-md mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-5">
          {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-2xl text-sm">{error}</div>}

          {/* Name + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                <User className="w-3.5 h-3.5" /> Nom complet *
              </label>
              <input
                value={form.customerName}
                onChange={(e) => set("customerName", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-300"
                placeholder="Votre nom"
                required
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                <Phone className="w-3.5 h-3.5" /> Téléphone *
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-300"
                placeholder="+213 …"
                required
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
              <Calendar className="w-3.5 h-3.5" /> Date *
            </label>
            <input
              type="date"
              value={form.date}
              min={today}
              onChange={(e) => set("date", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-300"
              required
            />
          </div>

          {/* Time slots */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
              <Clock className="w-3.5 h-3.5" /> Heure *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => set("time", slot)}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                    form.time === slot
                      ? "text-white border-transparent"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                  style={form.time === slot ? { background: brand, borderColor: brand } : {}}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          {/* Guest count */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
              <Users className="w-3.5 h-3.5" /> Nombre de personnes
            </label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => set("guestCount", Math.max(1, form.guestCount - 1))}
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-gray-700 text-xl flex items-center justify-center transition">−</button>
              <span className="text-2xl font-black text-gray-900 w-8 text-center">{form.guestCount}</span>
              <button type="button" onClick={() => set("guestCount", Math.min(20, form.guestCount + 1))}
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-gray-700 text-xl flex items-center justify-center transition">+</button>
              <span className="text-gray-400 text-sm">personne{form.guestCount > 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes (optionnel)</label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              placeholder="Allergies, occasion spéciale, préférences de placement…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-orange-300"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !form.date || !form.time || !form.customerName || !form.phone}
            style={{ background: brand }}
            className="w-full text-white py-4 rounded-2xl font-bold text-base hover:opacity-90 transition disabled:opacity-50"
          >
            {submitting ? "Envoi en cours…" : "Envoyer la demande de réservation"}
          </button>

          <p className="text-center text-xs text-gray-400">
            Le restaurant vous contactera par téléphone pour confirmer votre réservation.
          </p>
        </form>
      </div>
    </div>
  );
}
