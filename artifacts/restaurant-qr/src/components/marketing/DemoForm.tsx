"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";

const BUSINESS_TYPES = [
  "Restaurant", "Café", "Fast-food", "Pizzeria", "Boulangerie / Pâtisserie",
  "Snack", "Grill", "Sushi / Asiatique", "Traiteur", "Chaîne / Franchise", "Autre",
];

const SOURCES = [
  { value: "google", label: "Google / Recherche" },
  { value: "social", label: "Réseaux sociaux" },
  { value: "friend", label: "Recommandation" },
  { value: "pricing_page", label: "Page tarifs" },
  { value: "other", label: "Autre" },
];

export function DemoForm() {
  const [form, setForm] = useState({
    name: "", restaurantName: "", email: "", phone: "",
    city: "", businessType: "", message: "", source: "other",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const set = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setError("Veuillez remplir les champs obligatoires");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Erreur lors de l'envoi");
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-2">Demande envoyée !</h3>
        <p className="text-gray-500 text-sm leading-relaxed">
          Notre équipe vous contactera sous 24h pour organiser votre démo personnalisée.
          Vérifiez vos messages et votre boîte mail.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom complet *</label>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-orange-400"
            placeholder="Votre nom"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Téléphone *</label>
          <input
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-orange-400"
            placeholder="+213 5XX XXX XXX"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email *</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-orange-400"
          placeholder="votre@email.com"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom du restaurant</label>
          <input
            value={form.restaurantName}
            onChange={(e) => set("restaurantName", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-orange-400"
            placeholder="Mon Restaurant"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ville</label>
          <input
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-orange-400"
            placeholder="Alger"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type d'établissement</label>
        <select
          value={form.businessType}
          onChange={(e) => set("businessType", e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-orange-400"
        >
          <option value="">Sélectionner…</option>
          {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message (optionnel)</label>
        <textarea
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
          rows={3}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-orange-400 resize-none"
          placeholder="Décrivez votre besoin ou posez vos questions…"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Comment nous avez-vous découvert ?</label>
        <select
          value={form.source}
          onChange={(e) => set("source", e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-orange-400"
        >
          {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {error && (
        <p className="text-red-500 text-sm bg-red-50 rounded-xl px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-50 shadow-lg shadow-orange-200 text-base"
      >
        {loading ? (
          "Envoi en cours…"
        ) : (
          <>
            <Send className="w-4 h-4" />
            Envoyer ma demande
          </>
        )}
      </button>

      <p className="text-xs text-gray-400 text-center">
        En envoyant ce formulaire, vous acceptez d'être contacté par notre équipe.
      </p>
    </form>
  );
}
