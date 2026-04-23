"use client";

import { useEffect, useState } from "react";

type Staff = { id: string; name: string; email: string; isActive: boolean; createdAt: string };

export function StaffClient() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    fetch("/api/merchant/staff").then((r) => r.json()).then((data) => {
      setStaff(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/merchant/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setShowForm(false);
    setForm({ name: "", email: "", password: "" });
    load();
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await fetch(`/api/merchant/staff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    load();
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-500 mt-1">Add and manage your restaurant staff accounts</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
        >
          + Add Staff
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-800">New Staff Account</h2>

          <div>
            <label className="block text-sm text-gray-600 mb-1.5">Full Name *</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-orange-400" required />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">Email *</label>
            <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-orange-400" required />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">Password *</label>
            <input type="text" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:border-orange-400"
              placeholder="Temporary password" required />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">{error}</div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold">
              {saving ? "Creating..." : "Create Staff"}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setError(""); }}
              className="text-gray-500 hover:text-gray-700 px-5 py-2.5 rounded-xl text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading...</div>
        ) : staff.length === 0 ? (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-2xl">
            <p className="text-4xl mb-3">👥</p>
            <p className="text-gray-600 font-medium">No staff accounts yet</p>
            <p className="text-gray-400 text-sm mt-1">Add staff members to help manage your restaurant</p>
          </div>
        ) : staff.map((s) => (
          <div key={s.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-sm font-bold text-orange-600">
                {s.name[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{s.name}</p>
                <p className="text-sm text-gray-500">{s.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.isActive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                {s.isActive ? "Active" : "Inactive"}
              </span>
              <button
                onClick={() => toggleActive(s.id, s.isActive)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${s.isActive ? "border-red-200 text-red-500 hover:bg-red-50" : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"}`}
              >
                {s.isActive ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
