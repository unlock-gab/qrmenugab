"use client";

import { useState } from "react";

type Props = {
  restaurantId: string;
  restaurantName: string;
  logoUrl: string | null;
  primaryColor: string | null;
};

export function ReserveClient({ restaurantId, restaurantName, logoUrl, primaryColor }: Props) {
  const brand = primaryColor || "#f97316";
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    reservationDate: "",
    guestCount: "2",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError("");
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
    setSubmitting(false);
    if (res.ok) {
      setSuccess(true);
    } else {
      const d = await res.json();
      setError(d.error || "Failed to submit reservation.");
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm w-full bg-white rounded-2xl shadow-lg p-10">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <span className="text-3xl">✓</span>
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">Reservation Received!</h2>
          <p className="text-gray-500 text-sm">Your reservation request has been submitted. The restaurant will confirm it shortly.</p>
          <button
            onClick={() => { setSuccess(false); setForm({ customerName: "", phone: "", reservationDate: "", guestCount: "2", notes: "" }); }}
            style={{ background: brand }}
            className="mt-6 w-full text-white py-3 rounded-xl font-bold text-sm hover:opacity-90 transition"
          >
            Make Another Reservation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div style={{ background: `linear-gradient(135deg, ${brand}, ${brand}cc)` }} className="py-8 px-4 text-center">
        {logoUrl
          ? <img src={logoUrl} alt={restaurantName} className="w-16 h-16 rounded-2xl object-cover mx-auto mb-3 bg-white/20" />
          : <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">🍽️</div>
        }
        <h1 className="text-xl font-black text-white">{restaurantName}</h1>
        <p className="text-white/80 text-sm mt-1">Reserve a Table</p>
      </div>

      <div className="max-w-md mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Your Name *</label>
            <input
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-300"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number *</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-300"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Date & Time *</label>
              <input
                type="datetime-local"
                value={form.reservationDate}
                onChange={(e) => setForm({ ...form, reservationDate: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-300"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Guests *</label>
              <input
                type="number"
                value={form.guestCount}
                onChange={(e) => setForm({ ...form, guestCount: e.target.value })}
                min="1"
                max="50"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-300"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Special Requests</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Any allergies, special occasions, preferences..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-orange-300"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{ background: brand }}
            className="w-full text-white py-3.5 rounded-xl font-bold text-sm hover:opacity-90 transition disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Request Reservation"}
          </button>
        </form>
      </div>
    </div>
  );
}
