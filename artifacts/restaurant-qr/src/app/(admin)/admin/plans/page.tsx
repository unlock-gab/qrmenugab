"use client";

import { useEffect, useState } from "react";

type Plan = {
  id: string; name: string; description: string | null; price: number | null;
  maxTables: number; maxMenuItems: number; maxStaffUsers: number; isActive: boolean;
  _count: { subscriptions: number };
};

const emptyForm = { name: "", description: "", price: "", maxTables: "10", maxMenuItems: "50", maxStaffUsers: "3" };

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch("/api/admin/plans").then((r) => r.json()).then((data) => {
      setPlans(data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const startEdit = (p: Plan) => {
    setEditingId(p.id);
    setForm({ name: p.name, description: p.description || "", price: p.price?.toString() || "", maxTables: p.maxTables.toString(), maxMenuItems: p.maxMenuItems.toString(), maxStaffUsers: p.maxStaffUsers.toString() });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const url = editingId ? `/api/admin/plans/${editingId}` : "/api/admin/plans";
    const method = editingId ? "PATCH" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, maxTables: parseInt(form.maxTables), maxMenuItems: parseInt(form.maxMenuItems), maxStaffUsers: parseInt(form.maxStaffUsers) }) });
    setSaving(false);
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    load();
  };

  const deactivate = async (id: string) => {
    if (!confirm("Désactiver ce forfait ?")) return;
    await fetch(`/api/admin/plans/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Forfaits d&apos;abonnement</h1>
          <p className="text-slate-400 mt-1">Gérer les niveaux d&apos;abonnement de la plateforme</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all">
          + Nouveau forfait
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 mb-8">
          <h2 className="font-semibold text-white mb-5">{editingId ? "Modifier le forfait" : "Créer un forfait"}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Nom du forfait *</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500" required />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Prix (DA/mois)</label>
                <input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500" placeholder="0" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Description</label>
              <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { key: "maxTables", label: "Tables max" },
                { key: "maxMenuItems", label: "Articles menu max" },
                { key: "maxStaffUsers", label: "Personnel max" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-sm text-slate-400 mb-1.5">{label}</label>
                  <input type="number" value={form[key as keyof typeof form]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500" />
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold">
                {saving ? "Enregistrement..." : editingId ? "Modifier le forfait" : "Créer le forfait"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-white px-5 py-2.5 rounded-xl text-sm">
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 text-slate-500 text-center py-8">Chargement...</div>
        ) : plans.map((p) => (
          <div key={p.id} className={`bg-slate-800/40 border rounded-2xl p-6 ${p.isActive ? "border-slate-700/50" : "border-slate-800 opacity-50"}`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-white text-lg">{p.name}</h3>
                <p className="text-slate-400 text-sm mt-0.5">{p.description}</p>
              </div>
              <p className="text-xl font-bold text-indigo-400 text-right shrink-0">
                {p.price ? `${Number(p.price).toLocaleString("fr-DZ")} DA` : "Gratuit"}
                {p.price && <span className="text-sm text-slate-500 font-normal block">/mois</span>}
              </p>
            </div>
            <div className="space-y-2 mb-5">
              {[
                { label: "Tables", value: p.maxTables },
                { label: "Articles menu", value: p.maxMenuItems },
                { label: "Personnel", value: p.maxStaffUsers },
              ].map((l) => (
                <div key={l.label} className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">{l.label}</span>
                  <span className="font-semibold text-white">{l.value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Abonnements actifs</span>
                <span className="font-semibold text-indigo-400">{p._count.subscriptions}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => startEdit(p)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm transition-all">
                Modifier
              </button>
              {p.isActive && (
                <button onClick={() => deactivate(p.id)}
                  className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 rounded-lg text-sm transition-all">
                  Désactiver
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
