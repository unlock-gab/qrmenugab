"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Restaurant = {
  id: string; name: string; slug: string; status: string; createdAt: string;
  users: Array<{ name: string; email: string }>;
  subscription?: { status: string; plan?: { name: string } } | null;
  _count: { tables: number; menuItems: number; orders: number };
};

const statusColors: Record<string, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  PENDING_SETUP: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  SUSPENDED: "bg-red-500/10 text-red-400 border-red-500/20",
  INACTIVE: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

export default function AdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = async (status?: string) => {
    setLoading(true);
    const url = status && status !== "all" ? `/api/admin/restaurants?status=${status}` : "/api/admin/restaurants";
    const res = await fetch(url);
    const data = await res.json();
    setRestaurants(data);
    setLoading(false);
  };

  useEffect(() => { load(filter); }, [filter]);

  const handleStatusChange = async (id: string, status: string) => {
    await fetch(`/api/admin/restaurants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load(filter);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Restaurants</h1>
          <p className="text-slate-400 mt-1">Manage all restaurant accounts on the platform</p>
        </div>
        <Link
          href="/admin/restaurants/new"
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
        >
          + New Restaurant
        </Link>
      </div>

      <div className="flex gap-2 mb-6">
        {["all", "ACTIVE", "PENDING_SETUP", "INACTIVE", "SUSPENDED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === s
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            {s === "all" ? "All" : s.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 border-b border-slate-700/50">
              <th className="text-left p-4 font-medium">Restaurant</th>
              <th className="text-left p-4 font-medium">Owner</th>
              <th className="text-left p-4 font-medium">Status</th>
              <th className="text-left p-4 font-medium">Plan</th>
              <th className="text-center p-4 font-medium">Tables</th>
              <th className="text-center p-4 font-medium">Items</th>
              <th className="text-right p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center text-slate-500">Loading...</td></tr>
            ) : restaurants.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-slate-500">No restaurants found</td></tr>
            ) : restaurants.map((r) => (
              <tr key={r.id} className="hover:bg-slate-700/20 transition-colors">
                <td className="p-4">
                  <p className="font-medium text-white">{r.name}</p>
                  <p className="text-slate-500 text-xs">/{r.slug}</p>
                </td>
                <td className="p-4">
                  <p className="text-slate-300">{r.users[0]?.name || "—"}</p>
                  <p className="text-slate-500 text-xs">{r.users[0]?.email || "—"}</p>
                </td>
                <td className="p-4">
                  <select
                    value={r.status}
                    onChange={(e) => handleStatusChange(r.id, e.target.value)}
                    className="bg-transparent border-0 text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PENDING_SETUP">PENDING SETUP</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${statusColors[r.status] || ""}`}>
                    {r.status.replace("_", " ")}
                  </span>
                </td>
                <td className="p-4 text-slate-400">
                  {r.subscription?.plan?.name || <span className="text-slate-600">No plan</span>}
                </td>
                <td className="p-4 text-center text-slate-300">{r._count.tables}</td>
                <td className="p-4 text-center text-slate-300">{r._count.menuItems}</td>
                <td className="p-4 text-right">
                  <Link
                    href={`/admin/restaurants/${r.id}`}
                    className="text-indigo-400 hover:text-indigo-300 text-xs font-medium"
                  >
                    Manage →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
