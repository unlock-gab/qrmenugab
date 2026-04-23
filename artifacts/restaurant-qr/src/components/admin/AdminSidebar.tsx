"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "◉" },
  { href: "/admin/restaurants", label: "Restaurants", icon: "🏪" },
  { href: "/admin/users", label: "Users", icon: "👥" },
  { href: "/admin/plans", label: "Plans", icon: "📦" },
];

type User = {
  name?: string | null;
  email?: string | null;
};

export function AdminSidebar({ user }: { user: User }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-950 flex flex-col h-full shrink-0 border-r border-slate-800/50">
      <div className="p-5 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
            <span className="text-white text-sm font-bold">⚡</span>
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">QR Menu</p>
            <p className="text-indigo-400 text-xs font-semibold">Platform Admin</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-slate-800/30">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Management</p>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin/dashboard"
              ? pathname === "/admin/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-indigo-500/15 text-indigo-400 font-semibold border border-indigo-500/20"
                  : "text-slate-500 hover:text-slate-200 hover:bg-slate-800/60"
              )}
            >
              <span className="text-base w-5 text-center shrink-0">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-800/50">
        <div className="px-3 py-2 mb-1">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0">
              {user.name?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full text-left px-3 py-2 text-xs text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
