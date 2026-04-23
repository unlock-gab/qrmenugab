"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Plan = { id: string; name: string; price: number | null };
type Restaurant = {
  id: string; name: string; slug: string; phone: string | null; address: string | null;
  status: string; onboardingCompleted: boolean; primaryColor: string | null; createdAt: string;
  users: Array<{ id: string; name: string; email: string; role: string; isActive: boolean; createdAt: string }>;
  subscription: { status: string; plan: { id: string; name: string } } | null;
  _count: { tables: number; menuItems: number; orders: number; categories: number };
};

const STATUS_FR: Record<string, string> = {
  ACTIVE: "Actif", PENDING_SETUP: "En attente", SUSPENDED: "Suspendu", INACTIVE: "Inactif",
};
const statusBadgeColors: Record<string, string> = {
  ACTIVE: "text-emerald-400", PENDING_SETUP: "text-amber-400", SUSPENDED: "text-red-400", INACTIVE: "text-slate-400",
};
const ROLE_FR: Record<string, string> = {
  MERCHANT_OWNER: "Propriétaire", MERCHANT_STAFF: "Personnel",
  PLATFORM_ADMIN: "Admin", STAFF_KITCHEN: "Cuisine", STAFF_WAITER: "Serveur", STAFF_CASHIER: "Caissier",
};

export default function AdminRestaurantDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    name: "", phone: "", address: "", status: "", primaryColor: "", planId: "", subscriptionStatus: ""
  });

  const load = async () => {
    const [rRes, pRes] = await Promise.all([
      fetch(`/api/admin/restaurants/${params?.id}`),
      fetch("/api/admin/plans"),
    ]);
    const r = await rRes.json();
    const p = await pRes.json();
    setRestaurant(r);
    setPlans(p);
    setForm({
      name: r.name || "", phone: r.phone || "", address: r.address || "",
      status: r.status || "ACTIVE", primaryColor: r.primaryColor || "",
      planId: r.subscription?.plan?.id || "", subscriptionStatus: r.subscription?.status || "ACTIVE",
    });
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true); setMsg("");
    const res = await fetch(`/api/admin/restaurants/${params?.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setMsg(res.ok ? "Modifications enregistrees !" : "Erreur lors de l enregistrement");
    if (res.ok) load();
    setTimeout(() => setMsg(""), 3000);
  };

  if (!restaurant) return <div className="p-8 text-slate-400">Chargement...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-300 text-sm mb-4 flex items-center gap-1">
        Retour aux restaurants
      </button>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">{restaurant.name}</h1>
          <p className="text-slate-400 mt-1">/{restaurant.slug}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-semibold ${statusBadgeColors[restaurant.status]}`}>
            {STATUS_FR[restaurant.status] || restaurant.status}
          </span>
          <span className={`text-xs px-2 py-1 rounded-full ${restaurant.onboardingCompleted ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
            {restaurant.onboardingCompleted ? "Configuration terminee" : "Configuration en attente"}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Tables", value: restaurant._count.tables },
          { label: "Articles menu", value: restaurant._count.menuItems },
          { label: "Categories", value: restaurant._count.categories },
          { label: "Commandes totales", value: restaurant._count.orders },
        ].map((s) => (
          <div key={s.label} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-white">Infos restaurant</h2>
          <Field label="Nom" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
          <Field label="Telephone" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
          <Field label="Adresse" value={form.address} onChange={(v) => setForm((f) => ({ ...f, address: v }))} />
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Couleur de marque</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.primaryColor || "#6366f1"} onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
                className="w-10 h-10 rounded-lg border border-slate-600 bg-transparent cursor-pointer" />
              <input type="text" value={form.primaryColor} onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" placeholder="#6366f1" />
            </div>
          </div>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-white">Statut et Abonnement</h2>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Statut du restaurant</label>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500">
              <option value="ACTIVE">Actif</option>
              <option value="PENDING_SETUP">En attente de configuration</option>
              <option value="INACTIVE">Inactif</option>
              <option value="SUSPENDED">Suspendu</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Forfait abonnement</label>
            <select value={form.planId} onChange={(e) => setForm((f) => ({ ...f, planId: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500">
              <option value="">Aucun forfait</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>{p.name} {p.price ? `(${Number(p.price).toLocaleString("fr-DZ")} DA/mois)` : ""}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Statut de l abonnement</label>
            <select value={form.subscriptionStatus} onChange={(e) => setForm((f) => ({ ...f, subscriptionStatus: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500">
              <option value="TRIAL">Essai</option>
              <option value="ACTIVE">Actif</option>
              <option value="EXPIRED">Expire</option>
              <option value="CANCELLED">Annule</option>
            </select>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 mb-8">
        <button onClick={handleSave} disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all">
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
        {msg && <span className={`text-sm ${msg.includes("Erreur") ? "text-red-400" : "text-emerald-400"}`}>{msg}</span>}
      </div>
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6">
        <h2 className="font-semibold text-white mb-4">Utilisateurs</h2>
        <div className="space-y-3">
          {restaurant.users.map((u) => (
            <div key={u.id} className="flex items-center justify-between bg-slate-900/50 rounded-xl p-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {u.name[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{u.name}</p>
                  <p className="text-xs text-slate-500">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === "MERCHANT_OWNER" ? "bg-indigo-500/10 text-indigo-400" : "bg-slate-700 text-slate-400"}`}>
                  {ROLE_FR[u.role] || u.role}
                </span>
                <span className={`text-xs ${u.isActive ? "text-emerald-400" : "text-red-400"}`}>
                  {u.isActive ? "Actif" : "Inactif"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm text-slate-400 mb-1.5">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors" />
    </div>
  );
}
