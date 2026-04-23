"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Stats = {
  restaurants: { total: number; active: number; pending: number; suspended: number; inactive: number };
  users: { total: number; merchants: number };
  todayOrders: number;
  totalMenuItems: number;
  totalTables: number;
  recentRestaurants: Array<{
    id: string; name: string; slug: string; status: string; createdAt: string;
    subscription?: { status: string; plan?: { name: string } } | null;
  }>;
};

const statusColors: Record<string, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  PENDING_SETUP: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  SUSPENDED: "bg-red-500/10 text-red-400 border-red-500/20",
  INACTIVE: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-800 rounded w-48" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-slate-800 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return <div className="p-8 text-red-400">Failed to load stats</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
        <p className="text-slate-400 mt-1">Monitor your SaaS platform at a glance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Restaurants" value={stats.restaurants.total} icon="🏪" color="indigo" />
        <StatCard label="Active" value={stats.restaurants.active} icon="✅" color="emerald" />
        <StatCard label="Pending Setup" value={stats.restaurants.pending} icon="⏳" color="amber" />
        <StatCard label="Suspended" value={stats.restaurants.suspended} icon="🚫" color="red" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label="Orders Today" value={stats.todayOrders} icon="📋" color="violet" />
        <StatCard label="Total Users" value={stats.users.total} icon="👥" color="sky" />
        <StatCard label="Menu Items" value={stats.totalMenuItems} icon="✦" color="pink" />
        <StatCard label="Active Tables" value={stats.totalTables} icon="⊞" color="teal" />
      </div>

      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-white">Recent Restaurants</h2>
          <Link href="/admin/restaurants" className="text-sm text-indigo-400 hover:text-indigo-300">
            View all →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 border-b border-slate-700/50">
                <th className="text-left pb-3 font-medium">Restaurant</th>
                <th className="text-left pb-3 font-medium">Status</th>
                <th className="text-left pb-3 font-medium">Plan</th>
                <th className="text-left pb-3 font-medium">Created</th>
                <th className="text-right pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {stats.recentRestaurants.map((r) => (
                <tr key={r.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="py-3">
                    <p className="font-medium text-white">{r.name}</p>
                    <p className="text-slate-500 text-xs">/{r.slug}</p>
                  </td>
                  <td className="py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${statusColors[r.status] || statusColors.INACTIVE}`}>
                      {r.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 text-slate-400">
                    {r.subscription?.plan?.name || "—"}
                  </td>
                  <td className="py-3 text-slate-500 text-xs">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 text-right">
                    <Link
                      href={`/admin/restaurants/${r.id}`}
                      className="text-indigo-400 hover:text-indigo-300 text-xs font-medium"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
              {stats.recentRestaurants.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">No restaurants yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <Link href="/admin/restaurants/new" className="block bg-indigo-600 hover:bg-indigo-500 rounded-2xl p-5 transition-all group">
          <p className="text-lg font-bold text-white">+ New Restaurant</p>
          <p className="text-indigo-200 text-sm mt-1">Create a merchant account & restaurant</p>
        </Link>
        <Link href="/admin/plans" className="block bg-slate-800 hover:bg-slate-700 border border-slate-700/50 rounded-2xl p-5 transition-all">
          <p className="text-lg font-bold text-white">📦 Manage Plans</p>
          <p className="text-slate-400 text-sm mt-1">Create and edit subscription plans</p>
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  const colorMap: Record<string, string> = {
    indigo: "from-indigo-500/10 border-indigo-500/20 text-indigo-400",
    emerald: "from-emerald-500/10 border-emerald-500/20 text-emerald-400",
    amber: "from-amber-500/10 border-amber-500/20 text-amber-400",
    red: "from-red-500/10 border-red-500/20 text-red-400",
    violet: "from-violet-500/10 border-violet-500/20 text-violet-400",
    sky: "from-sky-500/10 border-sky-500/20 text-sky-400",
    pink: "from-pink-500/10 border-pink-500/20 text-pink-400",
    teal: "from-teal-500/10 border-teal-500/20 text-teal-400",
  };

  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-2xl p-5`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="text-xs mt-1 text-slate-400">{label}</p>
    </div>
  );
}
