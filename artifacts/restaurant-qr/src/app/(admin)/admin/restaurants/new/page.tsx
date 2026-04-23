"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Plan = { id: string; name: string; price: number | null };

export default function NewRestaurantPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    restaurantName: "", slug: "", ownerName: "", ownerEmail: "",
    ownerPassword: "", planId: "", status: "PENDING_SETUP",
  });

  useEffect(() => {
    fetch("/api/admin/plans").then((r) => r.json()).then(setPlans);
  }, []);

  const autoSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

  const handleNameChange = (name: string) => {
    setForm((f) => ({ ...f, restaurantName: name, slug: f.slug || autoSlug(name) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/restaurants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Erreur lors de la création du restaurant");
      setLoading(false);
      return;
    }
    router.push(`/admin/restaurants/${data.id}`);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-300 text-sm mb-4 flex items-center gap-1">
          ← Retour
        </button>
        <h1 className="text-2xl font-bold text-white">Créer un nouveau restaurant</h1>
        <p className="text-slate-400 mt-1">Configurer le compte restaurant et les identifiants propriétaire</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-white">Infos restaurant</h2>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Nom du restaurant *</label>
            <input type="text" value={form.restaurantName} onChange={(e) => handleNameChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="Mon Restaurant" required />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Slug (identifiant URL) *</label>
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl overflow-hidden focus-within:border-indigo-500 transition-colors">
              <span className="px-3 text-slate-500 text-sm">/menu/</span>
              <input type="text" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                className="flex-1 bg-transparent px-2 py-2.5 text-white placeholder-slate-600 focus:outline-none"
                placeholder="mon-restaurant" required />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Statut initial</label>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors">
              <option value="PENDING_SETUP">En attente de configuration</option>
              <option value="ACTIVE">Actif</option>
              <option value="INACTIVE">Inactif</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Forfait d&apos;abonnement</label>
            <select value={form.planId} onChange={(e) => setForm((f) => ({ ...f, planId: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors">
              <option value="">Aucun forfait assigné</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.price ? `(${Number(p.price).toLocaleString("fr-DZ")} DA/mois)` : "(gratuit)"}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-white">Compte propriétaire</h2>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Nom complet du propriétaire *</label>
            <input type="text" value={form.ownerName} onChange={(e) => setForm((f) => ({ ...f, ownerName: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="Prénom Nom" required />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Email du propriétaire *</label>
            <input type="email" value={form.ownerEmail} onChange={(e) => setForm((f) => ({ ...f, ownerEmail: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="proprietaire@restaurant.com" required />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Mot de passe initial *</label>
            <input type="text" value={form.ownerPassword} onChange={(e) => setForm((f) => ({ ...f, ownerPassword: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="Mot de passe temporaire" required />
            <p className="text-xs text-slate-500 mt-1">Le propriétaire utilisera ce mot de passe pour sa première connexion</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">{error}</div>
        )}

        <button type="submit" disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all">
          {loading ? "Création en cours..." : "Créer le restaurant et le compte propriétaire"}
        </button>
      </form>
    </div>
  );
}
