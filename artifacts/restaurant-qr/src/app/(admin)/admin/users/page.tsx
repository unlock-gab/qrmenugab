"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type User = {
  id: string; name: string; email: string; role: string; isActive: boolean; createdAt: string;
  restaurant: { id: string; name: string; slug: string; status: string } | null;
};

const roleColors: Record<string, string> = {
  PLATFORM_ADMIN: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  MERCHANT_OWNER: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  MERCHANT_STAFF: "bg-sky-500/10 text-sky-400 border-sky-500/20",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = (role?: string) => {
    const url = role && role !== "all" ? `/api/admin/users?role=${role}` : "/api/admin/users";
    fetch(url).then((r) => r.json()).then((data) => {
      setUsers(data);
      setLoading(false);
    });
  };

  useEffect(() => { load(filter); }, [filter]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="text-slate-400 mt-1">All platform users across restaurants</p>
      </div>

      <div className="flex gap-2 mb-6">
        {["all", "PLATFORM_ADMIN", "MERCHANT_OWNER", "MERCHANT_STAFF"].map((r) => (
          <button key={r} onClick={() => setFilter(r)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === r ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}>
            {r === "all" ? "All" : r.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 border-b border-slate-700/50">
              <th className="text-left p-4 font-medium">User</th>
              <th className="text-left p-4 font-medium">Role</th>
              <th className="text-left p-4 font-medium">Restaurant</th>
              <th className="text-left p-4 font-medium">Status</th>
              <th className="text-left p-4 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500">No users found</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-700/20 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold text-white">
                      {u.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-white">{u.name}</p>
                      <p className="text-slate-500 text-xs">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${roleColors[u.role] || ""}`}>
                    {u.role.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="p-4">
                  {u.restaurant ? (
                    <Link href={`/admin/restaurants/${u.restaurant.id}`} className="text-indigo-400 hover:text-indigo-300">
                      {u.restaurant.name}
                    </Link>
                  ) : <span className="text-slate-600">—</span>}
                </td>
                <td className="p-4">
                  <span className={`text-xs font-semibold ${u.isActive ? "text-emerald-400" : "text-red-400"}`}>
                    {u.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-4 text-slate-500 text-xs">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
